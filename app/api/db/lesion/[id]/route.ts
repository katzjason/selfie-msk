import { NextResponse } from "next/server";
import { pool } from "@/app/api/db/pool";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const runtime = "nodejs";

function cleanDiagnosisPrefix(diagnosis: string): string {
  return diagnosis.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

// GET /api/db/lesion/[id] — fetch full detail for one lesion
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lesionId = parseInt(id, 10);
  if (isNaN(lesionId)) {
    return NextResponse.json({ ok: false, error: "Invalid lesion id" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `
      SELECT
        p.patient_id, p.age_range, p.sex, p.monk_skin_tone,
        p.fitzpatrick_skin_type, p.self_reported_race,
        l.id AS lesion_id, l.anatomic_site, l.vectra_id,
        l.biopsied, l.clinical_diagnosis,
        json_agg(json_build_object(
          'id', i.id,
          'file_path', i.file_path,
          'image_type', i.image_type,
          'captured_at', i.captured_at,
          'poor_quality', i.poor_quality,
          'contains_phi', i.contains_phi
        )) AS images
      FROM patients p
      JOIN lesions l ON p.patient_id = l.patient_id
      JOIN images i ON l.id = i.lesion_id
      WHERE l.id = $1
      GROUP BY p.patient_id, l.id
      `,
      [lesionId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Lesion not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: rows[0] });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}

// PUT /api/db/lesion/[id] — update patient demographics + lesion fields
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lesionId = parseInt(id, 10);
  if (isNaN(lesionId)) {
    return NextResponse.json({ ok: false, error: "Invalid lesion id" }, { status: 400 });
  }

  const body = await req.json();
  const { patient, lesion, new_mrn } = body;

  const client = await pool.connect();
  const completedRenames: { oldPath: string; newPath: string }[] = [];

  try {
    await client.query("BEGIN");

    // Fetch current lesion to get patient_id and current diagnosis
    const current = await client.query(
      `SELECT patient_id, clinical_diagnosis FROM lesions WHERE id = $1`,
      [lesionId]
    );
    if (current.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ ok: false, error: "Lesion not found" }, { status: 404 });
    }

    const patientId = current.rows[0].patient_id;
    const oldDiagnosis = current.rows[0].clinical_diagnosis;

    // Update patient demographics
    await client.query(
      `
      UPDATE patients
      SET age_range = $1, sex = $2, monk_skin_tone = $3,
          fitzpatrick_skin_type = $4, self_reported_race = $5
      WHERE patient_id = $6
      `,
      [
        patient.age_range,
        patient.sex,
        patient.monk_skin_tone || null,
        patient.fitzpatrick_skin_type || null,
        patient.self_reported_race || null,
        patientId,
      ]
    );

    // Update lesion
    await client.query(
      `
      UPDATE lesions
      SET anatomic_site = $1, vectra_id = $2, biopsied = $3, clinical_diagnosis = $4
      WHERE id = $5
      `,
      [
        lesion.anatomic_site,
        lesion.vectra_id || null,
        lesion.biopsied,
        lesion.clinical_diagnosis,
        lesionId,
      ]
    );

    // If diagnosis changed, rename image files
    const newDiagnosis = lesion.clinical_diagnosis;
    if (oldDiagnosis !== newDiagnosis) {
      const oldPrefix = cleanDiagnosisPrefix(oldDiagnosis);
      const newPrefix = cleanDiagnosisPrefix(newDiagnosis);

      const imageRows = await client.query(
        `SELECT id, file_path FROM images WHERE lesion_id = $1`,
        [lesionId]
      );

      for (const img of imageRows.rows) {
        const filePath = img.file_path as string;
        const dir = path.dirname(filePath);
        const filename = path.basename(filePath);

        // Only rename if filename starts with the old prefix
        if (filename.startsWith(oldPrefix + "_")) {
          const newFilename = newPrefix + "_" + filename.slice(oldPrefix.length + 1);
          const newFilePath = path.join(dir, newFilename);

          await fs.rename(filePath, newFilePath);
          completedRenames.push({ oldPath: filePath, newPath: newFilePath });

          await client.query(
            `UPDATE images SET file_path = $1 WHERE id = $2`,
            [newFilePath, img.id]
          );
        }
      }
    }

    // If new MRN provided (biopsy toggled false→true), hash and reassociate patient
    if (new_mrn && typeof new_mrn === "string" && new_mrn.trim()) {
      const mrnKeyPath = process.env.MRN_KEY_PATH ?? "/run/secrets/mrn_hmac_key";
      const hmacKey = await fs.readFile(mrnKeyPath);
      const hmac = crypto.createHmac("sha256", hmacKey);
      hmac.update(new_mrn.trim());
      const newPatientHash = hmac.digest("hex");

      // UPSERT: create patient if hash doesn't exist, else update demographics
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
        [
          newPatientHash,
          patient.age_range,
          patient.sex,
          patient.monk_skin_tone || null,
          patient.fitzpatrick_skin_type || null,
          patient.self_reported_race || null,
        ]
      );

      // Reassociate lesion with new patient
      await client.query(
        `UPDATE lesions SET patient_id = $1 WHERE id = $2`,
        [newPatientHash, lesionId]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.log(err.message);
    try { await client.query("ROLLBACK"); } catch {}
    // Undo any file renames that succeeded before the error
    for (const r of completedRenames) {
      try { await fs.rename(r.newPath, r.oldPath); } catch {}
    }
    return NextResponse.json({ ok: false, error: err?.message ?? "Unknown failure" }, { status: 500 });
  } finally {
    client.release();
  }
}

// DELETE /api/db/lesion/[id] — delete lesion with cascade
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lesionId = parseInt(id, 10);
  if (isNaN(lesionId)) {
    return NextResponse.json({ ok: false, error: "Invalid lesion id" }, { status: 400 });
  }

  const client = await pool.connect();
  let filesToDelete: string[] = [];

  try {
    await client.query("BEGIN");

    // Fetch image file paths
    const imageRows = await client.query(
      `SELECT file_path FROM images WHERE lesion_id = $1`,
      [lesionId]
    );
    filesToDelete = imageRows.rows.map((r: any) => r.file_path);

    // Fetch patient_id
    const lesionRow = await client.query(
      `SELECT patient_id FROM lesions WHERE id = $1`,
      [lesionId]
    );
    if (lesionRow.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ ok: false, error: "Lesion not found" }, { status: 404 });
    }
    const patientId = lesionRow.rows[0].patient_id;

    // Delete images from DB
    await client.query(`DELETE FROM images WHERE lesion_id = $1`, [lesionId]);

    // Delete lesion
    await client.query(`DELETE FROM lesions WHERE id = $1`, [lesionId]);

    // Check if patient has other lesions
    const remaining = await client.query(
      `SELECT COUNT(*) FROM lesions WHERE patient_id = $1`,
      [patientId]
    );
    if (parseInt(remaining.rows[0].count, 10) === 0) {
      await client.query(`DELETE FROM patients WHERE patient_id = $1`, [patientId]);
    }

    await client.query("COMMIT");

    // Delete files from disk after successful commit (best-effort)
    for (const fp of filesToDelete) {
      try { await fs.rm(fp, { force: true }); } catch {}
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.log(err.message);
    try { await client.query("ROLLBACK"); } catch {}
    return NextResponse.json({ ok: false, error: err?.message ?? "Unknown failure" }, { status: 500 });
  } finally {
    client.release();
  }
}
