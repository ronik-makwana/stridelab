import { useCallback } from "react";

import { checkAuth } from "../services/authApi.js";
import useAuthStore from "../store/authStore.js";

const useAuth = () => {
  const { user, loading, setUser, setLoading } = useAuthStore();

  const initializeAuth = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await checkAuth();
      setUser(data?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setUser]);

  return { user, loading, initializeAuth };
};

export default useAuth;
