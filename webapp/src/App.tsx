import {
    createRootRoute,
    createRoute,
    createRouter,
    Outlet,
    RouterProvider,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Toaster } from "sonner";

import { Sidebar } from "@/components/layout/sidebar";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { useAuthStore } from "@/stores/auth-store";

import { LoginPage } from "@/pages/login";
import { SignupPage } from "@/pages/signup";
import { DashboardPage } from "@/pages/dashboard";
import { CalendarPage } from "@/pages/calendar";
import { TasksPage } from "@/pages/tasks";
import { TeamsPage } from "@/pages/teams";
import { AlertsPage } from "@/pages/alerts";
import { AnalyticsPage } from "@/pages/analytics";
import { InventoryPage } from "@/pages/inventory";
import { RoomsPage } from "@/pages/rooms";

import "./index.css";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60,
            retry: 1,
        },
    },
});

// Root layout
const rootRoute = createRootRoute({
    component: () => <Outlet />,
});

// Main layout (with sidebar)
function MainLayout() {
    return (
        <ProtectedRoute>
            <div className="flex min-h-screen bg-slate-900">
                <Sidebar />
                <main className="flex-1 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </ProtectedRoute>
    );
}

// Auth routes
const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/login",
    component: LoginPage,
});

const signupRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/signup",
    component: SignupPage,
});

// Main app layout route
const mainLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "main",
    component: MainLayout,
});

// Dashboard (index route)
const dashboardRoute = createRoute({
    getParentRoute: () => mainLayoutRoute,
    path: "/",
    component: DashboardPage,
});

// Calendar
const calendarRoute = createRoute({
    getParentRoute: () => mainLayoutRoute,
    path: "/calendar",
    component: CalendarPage,
});

// Tasks
const tasksRoute = createRoute({
    getParentRoute: () => mainLayoutRoute,
    path: "/tasks",
    component: TasksPage,
});

// Teams
const teamsRoute = createRoute({
    getParentRoute: () => mainLayoutRoute,
    path: "/teams",
    component: TeamsPage,
});

// Alerts
const alertsRoute = createRoute({
    getParentRoute: () => mainLayoutRoute,
    path: "/alerts",
    component: AlertsPage,
});

// Analytics
const analyticsRoute = createRoute({
    getParentRoute: () => mainLayoutRoute,
    path: "/analytics",
    component: AnalyticsPage,
});

// Inventory
const inventoryRoute = createRoute({
    getParentRoute: () => mainLayoutRoute,
    path: "/inventory",
    component: InventoryPage,
});

// Rooms
const roomsRoute = createRoute({
    getParentRoute: () => mainLayoutRoute,
    path: "/rooms",
    component: RoomsPage,
});

// Build route tree
const routeTree = rootRoute.addChildren([
    loginRoute,
    signupRoute,
    mainLayoutRoute.addChildren([
        dashboardRoute,
        calendarRoute,
        tasksRoute,
        teamsRoute,
        alertsRoute,
        analyticsRoute,
        inventoryRoute,
        roomsRoute,
    ]),
]);

// Create router
const router = createRouter({ routeTree });

// Type registration for TypeScript
declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}

function App() {
    const { setLoading, token } = useAuthStore();

    useEffect(() => {
        // Check if user is already logged in on mount
        if (token) {
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, [token, setLoading]);

    return (
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <Toaster
                position="top-right"
                theme="dark"
                richColors
                closeButton
                toastOptions={{
                    style: {
                        background: "rgba(30, 41, 59, 0.9)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        backdropFilter: "blur(8px)",
                    },
                }}
            />
        </QueryClientProvider>
    );
}

export default App;
