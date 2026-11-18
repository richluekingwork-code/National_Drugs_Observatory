
import { useCallback, useEffect, useState } from "react";

export function useResource(resource, id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!id) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await resource.get(id);
      setData(result?.data ?? result);
    } catch (err) {
      setData(null);
      setError(
        err?.response?.data?.detail ??
          err?.response?.data?.message ??
          err?.message ??
          "Could not load this record."
      );
    } finally {
      setLoading(false);
    }
  }, [resource, id]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) {
        setData(null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await resource.get(id);

        if (!cancelled) {
          setData(result?.data ?? result);
        }
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setError(
            err?.response?.data?.detail ??
              err?.response?.data?.message ??
              err?.message ??
              "Could not load this record."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [resource, id]);

  return { data, loading, error, reload };
}
