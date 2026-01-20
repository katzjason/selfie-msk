import { NextResponse } from "next/server";
import { pool } from "@/app/api/db/pool";

export const runtime = "nodejs";


export async function POST(req: Request) {
    const client = await pool.connect();

  try {
    const data = await req.formData();
    // Required fields
    const message = String(data.get("message") ?? "").trim();

    // Validate missing field early (fast 400s)
    if (!message) return NextResponse.json({ ok: false, error: "message is required" }, { status: 400 });

    // DB upload
    await client.query("BEGIN");
    await client.query(
      `
      INSERT INTO bug_reports (message)
      VALUES ($1)
      `,
      [message]
    );

    await client.query("COMMIT");

    return NextResponse.json({ ok: true, status: 200});
  } catch (err: any) {
    console.log(err.message)
    try { await client.query("ROLLBACK"); } catch {}
    return NextResponse.json({ ok: false, error: err?.message ?? "Unknown failure" }, { status: 500 });
  } finally {
    client.release();
  }
}
