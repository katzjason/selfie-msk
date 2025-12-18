
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { pool } from "@/app/api/db/pool";


export async function POST(req: Request) {
    const data = await req.formData(); // request FormData
    // extract all db fields?
    const images = data.getAll("images");
    if(!images.length) return NextResponse.json({error: "No files to submit"}, {status: 400});

    const imageDir = process.env.IMAGE_DIR || "/data/images";
    await fs.mkdir(imageDir, {recursive: true});
    
    for (const image of images) {
        if (!(image instanceof File)) return NextResponse.json({error: "Missing file"}, {status: 400});

        const ext = path.extname(image.name) || ".jpg";
        const filename = `${randomUUID()}${ext}`;
        const absPath = path.join(imageDir, filename);
        const bytes = Buffer.from(await image.arrayBuffer());
        await fs.writeFile(absPath, bytes); // saving image to image volume
         // store a *container path* you can use later, or store just filename
        const file_path = path.posix.join(imageDir, filename);

        const result = await pool.query(
            `INSERT INTO images (file_path) VALUES ($1) RETURNING id, file_path, captured_at`,
            [file_path]
        );

        return NextResponse.json(result.rows[0]);

    }

    


}


// type CreatePayload = {
//   mrn_hash: string;
//   age_range: string;
//   sex?: "Male" | "Female" | "Other";
//   monk_skin_tone?: number;
//   fitzpatrick_skin_type?: number;
//   ita_score?: number;

//   anatomic_site: string;
//   vectra_id?: number;
//   biopsied?: boolean;
//   clinical_diagnosis?: string;

//   file_path: string;
// };

// export async function createPatientLesionImage(p: CreatePayload) {
//   const client = await pool.connect();
//   try {
//     await client.query("BEGIN");

//     // 1) patient (upsert so repeated captures for same patient work)
//     await client.query(
//       `INSERT INTO patients (mrn_hash, age_range, sex, monk_skin_tone, fitzpatrick_skin_type, ita_score)
//        VALUES ($1, $2, $3, $4, $5, $6)
//        ON CONFLICT (mrn_hash) DO UPDATE SET
//          age_range = EXCLUDED.age_range,
//          sex = EXCLUDED.sex,
//          monk_skin_tone = EXCLUDED.monk_skin_tone,
//          fitzpatrick_skin_type = EXCLUDED.fitzpatrick_skin_type,
//          ita_score = EXCLUDED.ita_score`,
//       [
//         p.mrn_hash,
//         p.age_range,
//         p.sex ?? null,
//         p.monk_skin_tone ?? null,
//         p.fitzpatrick_skin_type ?? null,
//         p.ita_score ?? null,
//       ]
//     );

//     // 2) lesion (returns new lesion id)
//     const lesionRes = await client.query(
//       `INSERT INTO lesions (mrn_hash, anatomic_site, vectra_id, biopsied, clinical_diagnosis)
//        VALUES ($1, $2, $3, $4, $5)
//        RETURNING id`,
//       [
//         p.mrn_hash,
//         p.anatomic_site,
//         p.vectra_id ?? null,
//         p.biopsied ?? null,
//         p.clinical_diagnosis ?? null,
//       ]
//     );

//     const lesionId: number = lesionRes.rows[0].id;

//     // 3) image referencing the lesion
//     const imageRes = await client.query(
//       `INSERT INTO images (file_path, vectra_id, lesion_id)
//        VALUES ($1, $2, $3)
//        RETURNING id, file_path, captured_at, lesion_id`,
//       [p.file_path, p.vectra_id ?? null, lesionId]
//     );

//     await client.query("COMMIT");
//     return { lesionId, image: imageRes.rows[0] };
//   } catch (err) {
//     await client.query("ROLLBACK");
//     throw err;
//   } finally {
//     client.release();
//   }
// }