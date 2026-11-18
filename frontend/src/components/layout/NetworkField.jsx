
import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Palettes (NDO brand).
// ---------------------------------------------------------------------------
const PALETTES = {
  light: {
    base: '#17324D',
    jade: '#247C78',
    gold: '#C6A66B',
    nodeAlpha: 0.7,
    lineAlpha: 0.3,
    logoOpacity: 0.06,
    wash:
      'radial-gradient(60% 50% at 88% 0%, rgba(36,124,120,0.07), transparent 70%),' +
      'radial-gradient(55% 50% at 0% 100%, rgba(198,166,107,0.09), transparent 70%)',
  },
  dark: {
    base: '#7FA6C9',
    jade: '#3FBFB5',
    gold: '#D9B97A',
    nodeAlpha: 0.85,
    lineAlpha: 0.26,
    logoOpacity: 0.05,
    wash:
      'radial-gradient(60% 50% at 88% 0%, rgba(63,191,181,0.10), transparent 70%),' +
      'radial-gradient(55% 50% at 0% 100%, rgba(217,185,122,0.10), transparent 70%)',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function detectMode() {
  const scheme = getComputedStyle(document.documentElement).colorScheme || '';
  if (scheme.trim() === 'dark') return 'dark';
  if (scheme.trim() === 'light') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function useColorMode(prop) {
  const [mode, setMode] = useState(() => (prop === 'auto' ? detectMode() : prop));

  useEffect(() => {
    if (prop !== 'auto') {
      setMode(prop);
      return undefined;
    }
    const update = () => setMode(detectMode());
    update();
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class', 'style'],
    });
    return () => {
      mql.removeEventListener('change', update);
      observer.disconnect();
    };
  }, [prop]);

  return mode;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mql.matches);
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);
  return reduced;
}

class Quiet extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {}
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Layout: node positions + links. Built once; never changes after mount.
// ---------------------------------------------------------------------------
function buildLayout(aspect) {
  const sy = 22;
  const sz = 10;
  const sx = sy * clamp(aspect, 0.6, 2.4) * 1.1;
  const volume = 8 * sx * sy * sz;
  const count = Math.round(clamp(volume / 520, 55, 170));

  const pts = [];
  for (let i = 0; i < count; i++) {
    let best = null;
    let bestD = -1;
    for (let c = 0; c < 14; c++) {
      const x = (Math.random() * 2 - 1) * sx;
      const y = (Math.random() * 2 - 1) * sy;
      const z = (Math.random() * 2 - 1) * sz;
      let d = Infinity;
      for (const q of pts) {
        const dx = q[0] - x;
        const dy = q[1] - y;
        const dz = (q[2] - z) * 0.7;
        d = Math.min(d, dx * dx + dy * dy + dz * dz);
      }
      if (d > bestD) {
        bestD = d;
        best = [x, y, z];
      }
    }
    pts.push(best);
  }

  const positions = new Float32Array(count * 3);
  pts.forEach((p, i) => positions.set(p, i * 3));

  const spacing = Math.cbrt(volume / count);
  const maxDist = spacing * 1.9;
  const seen = new Set();
  const pairs = [];
  const degree = new Uint8Array(count);

  for (let i = 0; i < count; i++) {
    const ds = [];
    for (let j = 0; j < count; j++) {
      if (j === i) continue;
      const dx = pts[j][0] - pts[i][0];
      const dy = pts[j][1] - pts[i][1];
      const dz = pts[j][2] - pts[i][2];
      ds.push([Math.sqrt(dx * dx + dy * dy + dz * dz), j]);
    }
    ds.sort((a, b) => a[0] - b[0]);
    for (let k = 0; k < 3; k++) {
      if (!ds[k] || ds[k][0] > maxDist) break;
      const j = ds[k][1];
      const key = i < j ? i * count + j : j * count + i;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push([i, j, ds[k][0]]);
      degree[i]++;
      degree[j]++;
    }
  }

  const hubCount = Math.max(3, Math.round(count * 0.07));
  const hubs = new Set(
    [...Array(count).keys()]
      .sort((a, b) => degree[b] + Math.random() * 0.5 - (degree[a] + Math.random() * 0.5))
      .slice(0, hubCount)
  );

  const roles = new Uint8Array(count);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    roles[i] = hubs.has(i) ? 2 : Math.random() < 0.32 ? 1 : 0;
    sizes[i] = hubs.has(i)
      ? 0.6 + degree[i] * 0.035
      : 0.24 + Math.random() * 0.16 + degree[i] * 0.025;
    phases[i] = Math.random() * Math.PI * 2;
  }

  const edges = pairs.map(([a, b, d]) => ({
    a,
    b,
    strength: 0.35 + 0.65 * (1 - d / maxDist),
    pulse: roles[a] === 2 || roles[b] === 2 || Math.random() < 0.22 ? 1 : 0,
    seed: Math.random(),
  }));

  return { count, positions, roles, sizes, phases, edges };
}

function buildGeometries(layout, palette) {
  const { count, positions, roles, sizes, phases, edges } = layout;
  const rgb = [hexToRgb(palette.base), hexToRgb(palette.jade), hexToRgb(palette.gold)];

  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) colors.set(rgb[roles[i]], i * 3);

  const pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pointsGeo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  pointsGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  pointsGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  const E = edges.length;
  const lPos = new Float32Array(E * 6);
  const lCol = new Float32Array(E * 6);
  const lPhase = new Float32Array(E * 2);
  const lT = new Float32Array(E * 2);
  const lPulse = new Float32Array(E * 2);
  const lSeed = new Float32Array(E * 2);
  const lStrength = new Float32Array(E * 2);

  edges.forEach((edge, e) => {
    [edge.a, edge.b].forEach((n, k) => {
      const v = e * 2 + k;
      lPos.set(positions.subarray(n * 3, n * 3 + 3), v * 3);
      lCol.set(rgb[roles[n]], v * 3);
      lPhase[v] = phases[n];
      lT[v] = k;
      lPulse[v] = edge.pulse;
      lSeed[v] = edge.seed;
      lStrength[v] = edge.strength;
    });
  });

  const linesGeo = new THREE.BufferGeometry();
  linesGeo.setAttribute('position', new THREE.BufferAttribute(lPos, 3));
  linesGeo.setAttribute('aColor', new THREE.BufferAttribute(lCol, 3));
  linesGeo.setAttribute('aPhase', new THREE.BufferAttribute(lPhase, 1));
  linesGeo.setAttribute('aT', new THREE.BufferAttribute(lT, 1));
  linesGeo.setAttribute('aPulse', new THREE.BufferAttribute(lPulse, 1));
  linesGeo.setAttribute('aSeed', new THREE.BufferAttribute(lSeed, 1));
  linesGeo.setAttribute('aStrength', new THREE.BufferAttribute(lStrength, 1));

  return { pointsGeo, linesGeo };
}

// ---------------------------------------------------------------------------
// Shaders
// ---------------------------------------------------------------------------
const DRIFT_GLSL = /* glsl */ `
  vec3 drift(vec3 p, float ph, float t) {
    return p + vec3(
      sin(t * 0.35 + ph),
      cos(t * 0.28 + ph * 1.7),
      sin(t * 0.22 + ph * 0.6)
    ) * 1.1;
  }
`;

const POINTS_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  uniform float uAlpha;
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aPhase;
  varying vec3 vColor;
  varying float vAlpha;
  ${DRIFT_GLSL}
  void main() {
    vec4 mv = modelViewMatrix * vec4(drift(position, aPhase, uTime), 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    gl_PointSize = aSize * uScale / depth;
    float fade = clamp(1.15 - (depth - 24.0) / 36.0, 0.18, 1.0);
    float breathe = 0.8 + 0.2 * sin(uTime * 0.9 + aPhase * 3.0);
    vAlpha = fade * breathe * uAlpha;
    vColor = aColor;
  }
`;

const POINTS_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float glow = pow(1.0 - d * 2.0, 2.0);
    float core = smoothstep(0.2, 0.1, d);
    gl_FragColor = vec4(vColor, (glow * 0.55 + core * 0.6) * vAlpha);
  }
`;

const LINES_VERT = /* glsl */ `
  uniform float uTime;
  attribute vec3 aColor;
  attribute float aPhase;
  attribute float aT;
  attribute float aPulse;
  attribute float aSeed;
  attribute float aStrength;
  varying vec3 vColor;
  varying float vT;
  varying float vPulse;
  varying float vSeed;
  varying float vStrength;
  varying float vDepth;
  ${DRIFT_GLSL}
  void main() {
    vec4 mv = modelViewMatrix * vec4(drift(position, aPhase, uTime), 1.0);
    gl_Position = projectionMatrix * mv;
    vDepth = clamp(1.15 - (-mv.z - 24.0) / 36.0, 0.18, 1.0);
    vColor = aColor;
    vT = aT;
    vPulse = aPulse;
    vSeed = aSeed;
    vStrength = aStrength;
  }
`;

const LINES_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uLineAlpha;
  uniform vec3 uPulseColor;
  varying vec3 vColor;
  varying float vT;
  varying float vPulse;
  varying float vSeed;
  varying float vStrength;
  varying float vDepth;
  void main() {
    float head = fract(uTime * (0.05 + vSeed * 0.06) + vSeed * 9.0) * 1.7 - 0.35;
    float pulse = vPulse * smoothstep(0.16, 0.0, abs(vT - head));
    vec3 col = mix(vColor, uPulseColor, pulse);
    float a = (vStrength * uLineAlpha + pulse * 0.85) * vDepth;
    gl_FragColor = vec4(col, a);
  }
`;

// ---------------------------------------------------------------------------
// Network: nodes, links, slow continuous spin. No pointer input.
// ---------------------------------------------------------------------------
function Network({ palette, animate }) {
  const group = useRef();

  const layout = useMemo(
    () => buildLayout(window.innerWidth / Math.max(window.innerHeight, 1)),
    []
  );
  const { pointsGeo, linesGeo } = useMemo(
    () => buildGeometries(layout, palette),
    [layout, palette]
  );

  const pointsMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: POINTS_VERT,
        fragmentShader: POINTS_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uScale: { value: 1 },
          uAlpha: { value: palette.nodeAlpha },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    [palette]
  );

  const linesMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: LINES_VERT,
        fragmentShader: LINES_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uLineAlpha: { value: palette.lineAlpha },
          uPulseColor: { value: new THREE.Vector3(...hexToRgb(palette.gold)) },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    [palette]
  );

  useEffect(() => () => pointsGeo.dispose(), [pointsGeo]);
  useEffect(() => () => linesGeo.dispose(), [linesGeo]);
  useEffect(() => () => pointsMat.dispose(), [pointsMat]);
  useEffect(() => () => linesMat.dispose(), [linesMat]);

  useFrame((state) => {
    // IMPORTANT: drive rotation from elapsed time (monotonic), NOT from
    // delta accumulation. Delta is 0 on some frames (e.g. first frame or
    // when the renderer is warming up), and it's easy to debug this way.
    const t = animate ? state.clock.elapsedTime : 6;

    pointsMat.uniforms.uTime.value = t;
    linesMat.uniforms.uTime.value = t;
    pointsMat.uniforms.uScale.value =
      (state.size.height * state.gl.getPixelRatio()) /
      (2 * Math.tan(THREE.MathUtils.degToRad(state.camera.fov) / 2));

    if (group.current) {
      if (animate) {
        // Continuous yaw — 0.12 rad/sec ≈ one revolution every ~52 s.
        group.current.rotation.y = t * 0.12;
        // Gentle pitch sway on top so it doesn't feel like a flat turntable.
        group.current.rotation.x = Math.sin(t * 0.031 + 1.3) * 0.06;
      } else {
        // Frozen pose (reduced-motion path).
        group.current.rotation.y = Math.sin(6 * 0.045) * 0.16;
        group.current.rotation.x = Math.sin(6 * 0.031 + 1.3) * 0.04;
      }
    }
  });

  return (
    <group ref={group}>
      <lineSegments geometry={linesGeo} material={linesMat} renderOrder={1} frustumCulled={false} />
      <points geometry={pointsGeo} material={pointsMat} renderOrder={2} frustumCulled={false} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Logo watermarks
// ---------------------------------------------------------------------------
function Logo({ src, index, total, opacity, animate }) {
  const mesh = useRef();
  const texture = useTexture(src);

  const cfg = useMemo(
    () => ({
      speed: 1.5 + ((index * 0.37) % 1) * 1.1,
      z: -14 - index * 4,
      y: (((index * 0.618) % 1) - 0.5) * 30,
      size: 9 + (index % 3) * 2,
      phase: index * 1.9,
      start: (index + 0.5) / total,
      x: null,
    }),
    [index, total]
  );

  const aspect = texture.image ? texture.image.height / texture.image.width : 1;

  useFrame((state, delta) => {
    const m = mesh.current;
    if (!m) return;

    const dist = state.camera.position.z - cfg.z;
    const halfH = Math.tan(THREE.MathUtils.degToRad(state.camera.fov) / 2) * dist;
    const halfW = halfH * (state.size.width / state.size.height);
    const edge = halfW + cfg.size / 2;

    if (cfg.x === null) cfg.x = -edge + cfg.start * edge * 2;
    if (animate) {
      cfg.x += cfg.speed * Math.min(delta, 0.1);
      if (cfg.x > edge) cfg.x = -edge;
    }

    const t = animate ? state.clock.elapsedTime : 0;
    m.position.set(cfg.x, cfg.y + Math.sin(t * 0.6 + cfg.phase) * 1.5, cfg.z);
  });

  return (
    <mesh ref={mesh} renderOrder={0}>
      <planeGeometry args={[cfg.size, cfg.size * aspect]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
export default function NetworkField({
  mode = 'auto',
  logo = '/logo.png',
  showLogos = true,
  surface = 'bg-base-200',
  motion = 'auto', // 'auto' | 'on' | 'off'
  debug = false,
}) {
  const resolved = useColorMode(mode);
  const prefersReduced = useReducedMotion();
  const palette = PALETTES[resolved];

  // Resolve the final animation policy.
  const reduced =
    motion === 'on' ? false : motion === 'off' ? true : prefersReduced;

  useEffect(() => {
    if (debug) {
      // eslint-disable-next-line no-console
      console.info('[NetworkField]', {
        motion,
        prefersReduced,
        reduced,
        animating: !reduced,
        frameloop: reduced ? 'demand' : 'always',
      });
    }
  }, [debug, motion, prefersReduced, reduced]);

  return (
    <div
      aria-hidden="true"
      data-network-field
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${surface}`}
      style={{ backgroundImage: palette.wash }}
    >
      <Canvas
        // If animations are disabled, "demand" saves GPU work. If enabled,
        // "always" ticks every rAF so shaders + rotation actually advance.
        frameloop={reduced ? 'demand' : 'always'}
        camera={{ position: [0, 0, 40], fov: 50, near: 1, far: 200 }}
        dpr={[1, 1.75]}
        gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Network palette={palette} animate={!reduced} />

        {showLogos && (
          <Quiet>
            <Suspense fallback={null}>
              {[0, 1, 2, 3].map((i) => (
                <Logo
                  key={i}
                  src={logo}
                  index={i}
                  total={4}
                  opacity={palette.logoOpacity}
                  animate={!reduced}
                />
              ))}
            </Suspense>
          </Quiet>
        )}
      </Canvas>
    </div>
  );
}