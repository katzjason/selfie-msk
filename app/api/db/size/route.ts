import { NextResponse } from "next/server";
import { pool } from "@/app/api/db/pool";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const client = await pool.connect();
      try {
          const query = `SELECT COUNT(*) FROM images;`;
          const count = await client.query(query);
          return NextResponse.json({ ok: true, size: count });
      } catch (err:any) {
          return NextResponse.json({ok: false, error: err.message}, {status: 500});
      } finally {
          client.release();
      }
}
