import { useState, useCallback } from 'react';

/**
 * useApi - Custom hook for making API requests
 * @returns { data, error, loading, request }
 * Usage:
 *   const { data, error, loading, request } = useApi();
 *   useEffect(() => { request({ endpoint: '/api/posts' }); }, []);
 *   // or for POST: request({ endpoint: '/api/posts', method: 'POST', body: {...} })
 */
function useApi() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const request = useCallback(async ({ endpoint, method = 'GET', body = null, headers = {} }) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...headers,
        },
        ...(body && { body: JSON.stringify(body) }),
      });
      const contentType = res.headers.get('content-type');
      let responseData = null;
      if (contentType && contentType.includes('application/json')) {
        responseData = await res.json();
      } else {
        responseData = await res.text();
      }
      if (!res.ok) throw new Error(responseData.error || responseData.message || 'API Error');
      setData(responseData);
      return responseData;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, error, loading, request };
}

export default useApi; 