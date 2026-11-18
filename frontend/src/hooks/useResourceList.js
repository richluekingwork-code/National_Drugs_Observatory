import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * Normalize API responses into a consistent paginated structure.
 *
 * Supports:
 * - Plain arrays: [{ id: 1 }, { id: 2 }]
 * - DRF pagination: { count: 2, results: [...] }
 * - Compatible paginated responses: { results: [...] }
 */
function normalizeListResponse(response) {
  if (Array.isArray(response)) {
    return {
      count: response.length,
      results: response,
    };
  }

  if (response && typeof response === "object") {
    return {
      ...response,
      count: Number.isFinite(response.count)
        ? response.count
        : Array.isArray(response.results)
          ? response.results.length
          : 0,
      results: Array.isArray(response.results)
        ? response.results
        : [],
    };
  }

  return {
    count: 0,
    results: [],
  };
}

/**
 * Fetches a resource list with debounced search, filters, ordering,
 * and protection against stale responses.
 *
 * @param {object} resource - Resource service exposing list().
 * @param {object} options - Hook options.
 * @param {object} options.initialFilters - Initial filters.
 * @param {string} options.ordering - Ordering expression.
 */
export function useResourceList(
  resource,
  { initialFilters = {}, ordering } = {},
) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState({
    count: 0,
    results: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reqId = useRef(0);

  const reload = useCallback(async () => {
    const id = ++reqId.current;

    setLoading(true);
    setError(null);

    try {
      const response = await resource.list({
        page,
        search,
        ordering,
        ...filters,
      });

      if (id === reqId.current) {
        setData(normalizeListResponse(response));
      }
    } catch (err) {
      if (id === reqId.current) {
        const body = err?.response?.data;

        setError(
          body?.detail ??
            body?.non_field_errors?.[0] ??
            "Could not load data. Please try again.",
        );
      }
    } finally {
      if (id === reqId.current) {
        setLoading(false);
      }
    }
  }, [resource, page, search, ordering, filters]);

  useEffect(() => {
    const timer = setTimeout(reload, 250);

    return () => clearTimeout(timer);
  }, [reload]);

  useEffect(() => {
    setPage(1);
  }, [search, filters]);

  // Invalidate outstanding requests when the hook unmounts.
  useEffect(() => {
    return () => {
      reqId.current += 1;
    };
  }, []);

  const setFilter = useCallback((key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }, []);

  return {
    page,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    setFilters,
    data,
    loading,
    error,
    reload,
  };
}