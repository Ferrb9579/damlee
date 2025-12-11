import { authRouter } from "./auth.js";
import { eventsRouter } from "./events.js";
import { tasksRouter } from "./tasks.js";
import { teamsRouter } from "./teams.js";
import { alertsRouter } from "./alerts.js";
import { analyticsRouter } from "./analytics.js";
import { assetsRouter } from "./assets.js";
import { roomsRouter } from "./rooms.js";
import { bookingsRouter } from "./bookings.js";

export const router = {
    auth: authRouter,
    tasks: tasksRouter,
    events: eventsRouter,
    teams: teamsRouter,
    alerts: alertsRouter,
    analytics: analyticsRouter,
    assets: assetsRouter,
    rooms: roomsRouter,
    bookings: bookingsRouter,
};

export type Router = typeof router;
