import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * Fetches resources with search, filters, and pagination.
 * Supports both plain arrays and paginated API responses.
 */
export function usePaginatedResource(
  fetcher,
  { initialFilters = {} } = {}
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
      const response = await fetcher({
        page,
        search,
        ...filters,
      });

      if (id !== reqId.current) return;

      // Support a plain array or a DRF paginated response.
      const results = Array.isArray(response)
        ? response
        : Array.isArray(response?.results)
          ? response.results
          : [];

      const count = Array.isArray(response)
        ? response.length
        : Number.isFinite(response?.count)
          ? response.count
          : results.length;

      setData({
        count,
        results,
        next: Array.isArray(response) ? null : response?.next ?? null,
        previous: Array.isArray(response)
          ? null
          : response?.previous ?? null,
      });
    } catch (err) {
      if (id === reqId.current) {
        setError(
          err?.response?.data?.detail ??
            err?.response?.data?.message ??
            "Could not load data. Please try again."
        );

        setData({
          count: 0,
          results: [],
          next: null,
          previous: null,
        });
      }
    } finally {
      if (id === reqId.current) {
        setLoading(false);
      }
    }
  }, [fetcher, page, search, filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      reload();
    }, 250);

    return () => clearTimeout(timer);
  }, [reload]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const setFilter = useCallback((key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));

    setPage(1);
  }, []);

  return {
    page,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    data,
    loading,
    error,
    reload,
  };
}
