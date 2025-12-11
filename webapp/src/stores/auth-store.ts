import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
    id: string;
    email: string;
    name: string;
    role: "admin" | "member";
    avatar?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

interface AuthActions {
    login: (user: User, token: string) => void;
    logout: () => void;
    setUser: (user: User) => void;
    setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: true,

            login: (user, token) => {
                localStorage.setItem("token", token);
                set({ user, token, isAuthenticated: true, isLoading: false });
            },

            logout: () => {
                localStorage.removeItem("token");
                set({ user: null, token: null, isAuthenticated: false, isLoading: false });
            },

            setUser: (user) => set({ user }),

            setLoading: (isLoading) => set({ isLoading }),
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
