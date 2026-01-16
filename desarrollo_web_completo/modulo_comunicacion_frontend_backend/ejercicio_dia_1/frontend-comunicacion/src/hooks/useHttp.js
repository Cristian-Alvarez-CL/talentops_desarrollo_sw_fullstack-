import { useState, useCallback } from 'react';

const useHttp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const sendRequest = useCallback(async (requestFunction, requestData = null) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await requestFunction(requestData);
      setSuccess(true);
      setLoading(false);
      return response.data;
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.error || 'Ocurrió un error en la comunicación';
      setError(msg);
      throw err;
    }
  }, []);

  const resetStates = () => {
    setError(null);
    setSuccess(false);
    setLoading(false);
  };

  return { loading, error, success, sendRequest, resetStates };
};

export default useHttp;