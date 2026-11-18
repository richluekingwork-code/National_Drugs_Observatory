import { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

/**
 * Turns whatever the API returns into a URL the browser can load.
 * "/media/persons/a.jpg" is relative to the API host, not the Vite dev server,
 * so it has to be prefixed with the API base URL.
 */
export function mediaUrl(path) {
  if (!path) return null;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

const SIZES = {
  sm: "size-9 text-xs",   // table rows
  md: "size-12 text-sm",
  lg: "size-28 text-2xl", // detail page
  xl: "size-40 text-4xl",
};

/**
 * Round photo with an initials fallback (no photo, or the image fails to load).
 *
 * @param {string} props.src   - photo URL from the API (relative or absolute)
 * @param {string} props.name  - full name, used for initials and alt text
 * @param {string} props.size  - "sm" | "md" | "lg" | "xl"
 * @param {string} props.shape - "circle" | "square"
 */
export default function PersonAvatar({ src, name = "", size = "sm", shape = "circle", className = "" }) {
  const [failed, setFailed] = useState(false);
  const url = mediaUrl(src);
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("") || "?";

  const radius = shape === "square" ? "rounded-2xl" : "rounded-full";
  const box = `${SIZES[size] ?? SIZES.sm} ${radius} shrink-0 ${className}`;

  if (!url || failed) {
    return (
      <span
        className={`grid place-items-center bg-primary/10 font-semibold text-primary ${box}`}
        aria-label={name || "No photo"}
      >
        {initials}
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={name ? `Photo of ${name}` : "Photo"}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ring-1 ring-base-300 ${box}`}
    />
  );
}