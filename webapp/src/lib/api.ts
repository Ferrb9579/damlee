import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

const API_URL = "http://localhost:3001/api";

// Create the RPC link with headers
const link = new RPCLink({
    url: API_URL,
    headers: () => {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    },
});

// Create ORPC client - using any to avoid cross-project type issues
// In production, use a shared types package
export const client = createORPCClient<any>(link);
