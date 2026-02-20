
import { Pool } from "pg";

declare global {
    var _pool: Pool | undefined;
}

export const pool =
    global._pool ?? new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
    });

if (process.env.NODE_ENV != "production") global._pool = pool;