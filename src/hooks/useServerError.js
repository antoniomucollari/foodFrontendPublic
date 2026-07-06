import { useState, useCallback } from "react";

export const useServerError = () => {
  const [serverError, setServerError] = useState(null);

  const handleError = useCallback((error) => {
    // Check if it's a server error (500+)
    const status = error?.response?.status || error?.status;
    if (status >= 500) {
      setServerError(error);
      return true; // Indicates this is a server error that we handled
    }
    return false; // Not a server error, let other handlers deal with it
  }, []);

  const clearError = useCallback(() => {
    setServerError(null);
  }, []);

  return {
    serverError,
    handleError,
    clearError,
    isServerError: serverError !== null
  };
};

export default useServerError;
