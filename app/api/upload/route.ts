import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { pool } from "@/app/api/db/pool";

export const runtime = "nodejs";

const diagnosisDict: Record<string, string> = {
  Angioma: "Angioma",
  "Solar lentigo": "Solar Lentigo",
  SK: "Seborrheic keratosis",
  LPLK: "Lichen planus-like keratosis",
  Dermatofibroma: "Dermatofibroma",
  Nevus: "Melanocytic nevus",
  BCC: "Basal cell carcinoma",
  SCC: "Squamous cell carcinoma",
  Melanoma: "Melanoma",
  Other: "Other",
};

const fitzpatrickDict: Record<string, number> = {
  "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6
}

function safeDiagnosis(raw: string) {
  return diagnosisDict[raw] ?? "Other";
}

function cleanIdForFilename(id: string): string {
  return id.trim().replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

export async function POST(req: Request) {
    const client = await pool.connect();
    const writtenFiles: string[] = [];
    let transactionStarted = false;

  try {
    const data = await req.formData();
    // Required fields
    const patient_id = String(data.get("patient_id") ?? "").trim();
    let patientIdValue: string;
    if (patient_id) {
      patientIdValue = patient_id; // Use raw MRN/Study ID directly
    } else {
      // Generate a unique patient_id so MRN-less patients don't collide
      patientIdValue = crypto.createHash("sha256").update(crypto.randomUUID()).digest("hex");
    }

    const age_range = String(data.get("age") ?? "").trim();
    const sex = String(data.get("sex") ?? "").trim();
    const anatomic_site = String(data.get("anatomic_site") ?? "").trim();

    // Validate early (fast 400s)
    if (!age_range) return NextResponse.json({ ok: false, error: "age is required" }, { status: 400 });
    if (!sex) return NextResponse.json({ ok: false, error: "sex is required" }, { status: 400 });
    if (!anatomic_site) return NextResponse.json({ ok: false, error: "anatomic_site is required" }, { status: 400 });

    const monk_skin_tone = data.get("monk_skin_tone") ? Number(data.get("monk_skin_tone")) : null;
    const fitzpatrick_skin_type = fitzpatrickDict[String(data.get("fitzpatrick"))] ? Number(fitzpatrickDict[String(data.get("fitzpatrick"))]) : null;
    const self_reported_race = data.get("race") ? String(data.get("race")) : null;

    const clinical_diagnosis = safeDiagnosis(String(data.get("clinical_diagnosis") ?? "").trim());
    const biopsied = String(data.get("biopsy") ?? "false") === "true";
    const lesion_id = data.get("lesion_id") ? Number(data.get("lesion_id")) : null;

    const device_type = String(data.get("device_type") ?? "unknown");
    const os = String(data.get("os") ?? "unknown");

    const images = data.getAll("images").filter((x): x is File => x instanceof File);
    if (images.length === 0) {
      return NextResponse.json({ ok: false, error: "No images uploaded" }, { status: 400 });
    }

    const imageMetas = String(data.get("metas"));
    const metasArr = JSON.parse(imageMetas);
    console.log(imageMetas);

    // Support image_types either as a single value or multiple values
    const imageTypes = data.getAll("image_types").map(String);

    const uploadId = crypto.randomUUID();
    
    // Image directory (volume mount in Docker)
    const imageDir = process.env.IMAGE_DIR ?? "/data/images";
    await fs.mkdir(imageDir, { recursive: true });

    // Write files first (so you only store DB rows for real files)
    // Prepend sanitized patient ID to client-supplied filename
    const idPrefix = cleanIdForFilename(patientIdValue);
    const stored = await Promise.all(
      images.map(async (file, i) => {
        const bytes = Buffer.from(await file.arrayBuffer());
        const absPath = path.join(imageDir, `${idPrefix}_${file.name}`);
        await fs.writeFile(absPath, bytes);
        writtenFiles.push(absPath);
        return { absPath, originalName: file.name, capturedAt: metasArr[i]["capture_time"], imageType: metasArr[i]?.code };
      })
    );

    await client.query("BEGIN");
    transactionStarted = true;
    console.log("BEGINNING QUERY");

    const where = await client.query(`
      SELECT inet_server_addr() as server_ip,
            inet_server_port() as server_port,
            current_database() as db,
            current_user as user;
    `);
    console.log("DB TARGET:", where.rows[0]);

    await client.query(
      `
      INSERT INTO patients (patient_id, age_range, sex, monk_skin_tone, fitzpatrick_skin_type, self_reported_race)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (patient_id) DO UPDATE SET
        age_range = EXCLUDED.age_range,
        sex = EXCLUDED.sex,
        monk_skin_tone = EXCLUDED.monk_skin_tone,
        fitzpatrick_skin_type = EXCLUDED.fitzpatrick_skin_type,
        self_reported_race = EXCLUDED.self_reported_race
      `,
      [patientIdValue, age_range, sex, monk_skin_tone, fitzpatrick_skin_type, self_reported_race]
    );

    console.log("INSERTED PATIENT");

    const lesionRes = await client.query(
      `
      INSERT INTO lesions (patient_id, anatomic_site, vectra_id, biopsied, clinical_diagnosis)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `,
      [patientIdValue, anatomic_site, lesion_id, biopsied, clinical_diagnosis]
    );

    console.log("INSERTED LESION");

    const lesionPrimaryKey = lesionRes.rows[0].id as number;

    for (const s of stored) {
      await client.query(
        `
        INSERT INTO images (file_path, captured_at, lesion_id, device_type, device_os, image_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [s.absPath, s.capturedAt, lesionPrimaryKey, device_type, os, s.imageType]
      );
    }
    console.log("INSERTED IMAGE METADATA");

    await client.query("COMMIT");

    return NextResponse.json({ ok: true, uploadId, imagesWritten: stored.length });
  } catch (err: any) {
    console.error(`[UPLOAD ERROR ${new Date().toISOString()}]`, err);
    if (transactionStarted) {
      try { await client.query("ROLLBACK"); } catch {}
    }
    await Promise.allSettled(writtenFiles.map((p) => fs.rm(p, { force: true })));

    const msg = err?.message ?? "";
    const code = err?.code ?? "";
    let userMessage = "Unknown failure";

    if (code === "ENOENT" && msg.includes("mrn_hmac_key")) {
      userMessage = "Server configuration error: MRN key file not found. Contact administrator.";
    } else if (code === "EACCES") {
      userMessage = "Server permission error: Cannot access required files. Contact administrator.";
    } else if (code === "ENOSPC") {
      userMessage = "Server storage full: No disk space remaining for images. Contact administrator.";
    } else if (msg.includes("timeout") || msg.includes("ETIMEDOUT")) {
      userMessage = "Database connection timed out. Please try again.";
    } else if (msg.includes("too many clients") || msg.includes("remaining connection slots")) {
      userMessage = "Server is busy. Please wait and try again.";
    } else if (msg.includes("connection refused") || msg.includes("ECONNREFUSED")) {
      userMessage = "Database unavailable. Please try again in a moment.";
    } else if (msg) {
      userMessage = `Upload failed: ${msg.substring(0, 120)}`;
    }

    return NextResponse.json({ ok: false, error: userMessage }, { status: 500 });
  } finally {
    client.release();
  }
}
