import { NextResponse } from "next/server";
import { pool } from "@/app/api/db/pool";

export const runtime = "nodejs";


export async function POST(req: Request) {
    const client = await pool.connect();

  try {
    const data = await req.formData();
    // Required fields
    const image_id_raw = String(data.get("image_id") ?? "").trim();
    const contains_phi_raw = String(data.get("contains_phi") ?? "").trim();

    // Validate and parse
    if (!image_id_raw) return NextResponse.json({ ok: false, error: "image_id is required" }, { status: 400 });
    if (contains_phi_raw !== "true" && contains_phi_raw !== "false") {
      return NextResponse.json({ ok: false, error: "contains_phi must be 'true' or 'false'" }, { status: 400 });
    }

    const image_id = parseInt(image_id_raw, 10);
    if (isNaN(image_id)) {
      return NextResponse.json({ ok: false, error: "image_id must be a valid integer" }, { status: 400 });
    }
    const contains_phi = contains_phi_raw === "true";

    // DB upload
    await client.query("BEGIN");
    await client.query(
      `
      UPDATE images
      SET contains_phi = $1
      WHERE id = $2
      `,
      [contains_phi, image_id]
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
