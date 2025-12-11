import jwt from "jsonwebtoken";
import type { Request } from "express";
import "dotenv/config";

const JWT_SECRET = process.env["JWT_SECRET"] ?? "fallback-secret-key";
const JWT_EXPIRES_IN = "7d";

export interface JWTPayload {
    userId: string;
    email: string;
    role: "admin" | "member";
}

export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
        return null;
    }
}

export function extractTokenFromRequest(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.substring(7);
    }
    return null;
}

export function getUserFromRequest(req: Request): JWTPayload | null {
    const token = extractTokenFromRequest(req);
    if (!token) return null;
    return verifyToken(token);
}
