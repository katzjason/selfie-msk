import { NextResponse } from "next/server";
import { pool } from "@/app/api/db/pool";

export const runtime = "nodejs";


export async function POST(req: Request) {
    const client = await pool.connect();

  try {
    const data = await req.formData();
    // Required fields
    const image_id_raw = String(data.get("image_id") ?? "").trim();
    const poor_quality_raw = String(data.get("poor_quality") ?? "").trim();

    // Validate and parse
    if (!image_id_raw) return NextResponse.json({ ok: false, error: "image_id is required" }, { status: 400 });
    if (poor_quality_raw !== "true" && poor_quality_raw !== "false") {
      return NextResponse.json({ ok: false, error: "poor_quality must be 'true' or 'false'" }, { status: 400 });
    }

    const image_id = parseInt(image_id_raw, 10);
    if (isNaN(image_id)) {
      return NextResponse.json({ ok: false, error: "image_id must be a valid integer" }, { status: 400 });
    }
    const poor_quality = poor_quality_raw === "true";

    // DB upload
    await client.query("BEGIN");
    await client.query(
      `
      UPDATE images
      SET poor_quality = $1
      WHERE id = $2
      `,
      [poor_quality, image_id]
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
