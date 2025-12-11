import { authRouter } from "./auth.js";
import { eventsRouter } from "./events.js";
import { tasksRouter } from "./tasks.js";
import { teamsRouter } from "./teams.js";
import { alertsRouter } from "./alerts.js";
import { analyticsRouter } from "./analytics.js";

export const router = {
    auth: authRouter,
    events: eventsRouter,
    tasks: tasksRouter,
    teams: teamsRouter,
    alerts: alertsRouter,
    analytics: analyticsRouter,
};

export type Router = typeof router;
