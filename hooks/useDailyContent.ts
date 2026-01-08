import { useEffect, useRef, useState } from 'react';

export function useDailyContent(fetchFn: (signal: AbortSignal) => Promise<any>, deps: any[] = [], initialValue: any = null) {
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    fetchFn(controller.signal)
      .then(setData)
      .catch(e => { if (e.name !== 'AbortError') setError(e); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, deps);

  return { data, loading, error };
}
