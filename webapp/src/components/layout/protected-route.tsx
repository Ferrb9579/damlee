import { Navigate, useLocation } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuthStore();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" search={{ redirect: location.pathname }} />;
    }

    return <>{children}</>;
}
