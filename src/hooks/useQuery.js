import { useNavigate, useSearchParams } from 'react-router-dom';

export function useQueryParams() {
  const [searchParams] = useSearchParams();
  return Object.fromEntries(searchParams.entries());
}

export function useUpdateQuery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  return function updateQuery(updates, options = {}) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === undefined || value === '') {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    }
    setSearchParams(next, { replace: options.replace !== false });
    if (options.navigate !== false) {
      navigate(`?${next.toString()}`);
    }
  };
}
