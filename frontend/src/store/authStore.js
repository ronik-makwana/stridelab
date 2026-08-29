import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  clearUser: () => set({ user: null, loading: false }),
}));

export default useAuthStore;
