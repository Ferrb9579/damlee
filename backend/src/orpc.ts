import { os } from "@orpc/server";
import type { Request } from "express";
import { getUserFromRequest, type JWTPayload } from "./middleware/auth.js";

// Context type for all procedures
export interface Context {
    req: Request;
    user: JWTPayload | null;
}

// Create the base ORPC instance
export const orpc = os.$context<Context>();

// Public procedure - no auth required
export const publicProcedure = orpc;

// Protected procedure - requires authentication
export const protectedProcedure = orpc.use(async ({ context, next }) => {
    if (!context.user) {
        throw new Error("Unauthorized: Please log in to access this resource");
    }
    return next({
        context: {
            ...context,
            user: context.user,
        },
    });
});

// Admin procedure - requires admin role
export const adminProcedure = protectedProcedure.use(async ({ context, next }) => {
    if (context.user.role !== "admin") {
        throw new Error("Forbidden: Admin access required");
    }
    return next({ context });
});

// Helper to create context from request
export function createContext(req: Request): Context {
    return {
        req,
        user: getUserFromRequest(req),
    };
}
