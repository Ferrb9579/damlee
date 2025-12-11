import { createORPCClient } from "@orpc/client";
import { createORPCReactQueryUtils } from "@orpc/react-query";
import type { Router } from "../../backend/src/router/index.js";

const API_URL = "http://localhost:3001/api";

// Create ORPC client with auth header
export const client = createORPCClient<Router>({
    baseURL: API_URL,
    headers: () => {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    },
});

// Create React Query utilities
export const orpc = createORPCReactQueryUtils(client);
