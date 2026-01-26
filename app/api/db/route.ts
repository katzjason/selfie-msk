import { NextResponse } from "next/server";
import { pool } from "@/app/api/db/pool";

export const runtime = "nodejs";

export async function GET(req: Request) {

    const diagnosisMap : Record<string, string> = {
        "Angioma": "Angioma",
        "Solar Lentigo":'Solar lentigo',
        "SK": 'Seborrheic keratosis',
        "LPLK":'Lichen planus-like keratosis',
        "Dermatofibroma":"Dermatofibroma",
        "Nevus":'Melanocytic nevus',
        "BCC":'Basal cell carcinoma',
        "SCC": 'Squamous cell carcinoma',
        "Melanoma": "Melanoma",
        "Other": "Other"
    }


    const { searchParams } = new URL(req.url);
    const last = Number(searchParams.get("last") ?? 10);
    const anatomicSite = searchParams.get("anatomicSite") || "";
    const rawDiagnosis = searchParams.get("diagnosis") || "";
    const diagnosis = diagnosisMap[rawDiagnosis] || "";
    const client = await pool.connect();
    try {
        // Build dynamic WHERE clause and params
        const conditions = [];
        const params: (string | number)[] = [last];
        let paramIdx = 2;
        if (anatomicSite && anatomicSite !== "") {
            conditions.push(`l.anatomic_site = $${paramIdx++}`);
            params.push(anatomicSite);
        }
        if (diagnosis && diagnosis !== "") {
            conditions.push(`l.clinical_diagnosis = $${paramIdx++}`);
            params.push(diagnosis);
        }
        const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

        const query = `
            SELECT 
                p.*, 
                l.id AS lesion_id,
                l.patient_id,
                l.anatomic_site,
                l.vectra_id,
                l.biopsied,
                l.clinical_diagnosis,
                STRING_AGG(i.file_path, ', ') AS filepaths,
                MIN(i.captured_at) AS captured_at,
                i.device_type,
                i.device_os,
                STRING_AGG(i.id::text, ', ') AS image_ids,
                STRING_AGG(i.poor_quality::text, ', ') AS image_poor_qualities,
                STRING_AGG(i.contains_phi::text, ', ') AS image_contains_phi,
                STRING_AGG(i.image_type, ', ') AS image_types
            FROM patients p
            JOIN lesions l ON p.patient_id = l.patient_id
            JOIN images i ON l.id = i.lesion_id
            ${whereClause}
            GROUP BY p.patient_id, l.id, i.device_type, i.device_os
            ORDER BY l.id DESC
            LIMIT $1;        
        `;
        const { rows } = await client.query(query, params);
        return NextResponse.json({ ok: true, data: rows });
    } catch (err:any) {
        return NextResponse.json({ok: false, error: err.message}, {status: 500});
    } finally {
        client.release();
    }

}