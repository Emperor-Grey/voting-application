import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  setAuthenticated: (username: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  username: null,
  setAuthenticated: (username) => set({ isAuthenticated: true, username }),
  logout: () => set({ isAuthenticated: false, username: null }),
}));
