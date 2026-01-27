import { NextResponse } from 'next/server';
import { pool } from '../db/pool';
import archiver from 'archiver';
import ExcelJS from 'exceljs';
import { existsSync } from 'fs';
import path from 'path';
import { Readable } from 'stream';

const IMAGE_DIR = process.env.IMAGE_DIR || '/data/images';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const lastMonths = body.lastMonths || 'All';
    const phiAllowed = body.phiAllowed === "All";
    const goodQualityOnly = body.goodQualityOnly === "Good quality only";

    console.log('Starting export with filters:', { lastMonths, phiAllowed, goodQualityOnly });

    // Build WHERE clause based on filters
    const whereClauses: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (lastMonths !== 'all') {
      whereClauses.push(`i.captured_at >= NOW() - INTERVAL '${lastMonths} months'`);
    }

    if (!phiAllowed) {
      whereClauses.push(`i.contains_phi = false`);
    }

    if (goodQualityOnly) {
      whereClauses.push(`i.poor_quality = false`);
    }

    const whereClause = whereClauses.length > 0 
      ? `WHERE ${whereClauses.join(' AND ')}` 
      : '';

    // Query for main data export
    const mainQuery = `
      SELECT 
        p.*,
        l.id as lesion_id,
        l.anatomic_site,
        l.clinical_diagnosis,
        l.vectra_id,
        l.biopsied,
        i.image_type,
        i.file_path,
        i.device_type,
        i.device_os,
        i.captured_at,
        i.poor_quality,
        i.contains_phi
      FROM patients p
      JOIN lesions l ON p.patient_id = l.patient_id
      JOIN images i ON l.id = i.lesion_id
      ${whereClause}
    `;

    // Query for feedback
    const feedbackQuery = `SELECT * FROM bug_reports`;

    console.log('Executing database queries...');
    const [mainResult, feedbackResult] = await Promise.all([
      pool.query(mainQuery),
      pool.query(feedbackQuery)
    ]);

    console.log(`Exported ${mainResult.rows.length} main records, ${feedbackResult.rows.length} feedback records`);

    // Create Excel files
    const mainWorkbook = new ExcelJS.Workbook();
    const mainSheet = mainWorkbook.addWorksheet('Data');
    
    if (mainResult.rows.length > 0) {
      // Add headers
      const columns = Object.keys(mainResult.rows[0]).map(key => ({
        header: key,
        key: key,
        width: 15
      }));
      mainSheet.columns = columns;
      
      // Add rows
      mainSheet.addRows(mainResult.rows);
    }

    const feedbackWorkbook = new ExcelJS.Workbook();
    const feedbackSheet = feedbackWorkbook.addWorksheet('Feedback');
    
    if (feedbackResult.rows.length > 0) {
      const columns = Object.keys(feedbackResult.rows[0]).map(key => ({
        header: key,
        key: key,
        width: 15
      }));
      feedbackSheet.columns = columns;
      feedbackSheet.addRows(feedbackResult.rows);
    }

    // Collect unique image paths
    const imagePaths = new Set<string>();
    for (const row of mainResult.rows) {
      const filepath = row.file_path || row.filepaths || row.filepath;
      if (filepath && filepath !== 'N/A') {
        // Handle comma-separated paths
        const paths = filepath.split(', ').map((p: string) => p.trim());
        for (let imgPath of paths) {
          // Strip /data/images/ or data/images/ prefix if present
          if (imgPath.startsWith('/data/images/')) {
            imgPath = imgPath.substring('/data/images/'.length);
          } else if (imgPath.startsWith('data/images/')) {
            imgPath = imgPath.substring('data/images/'.length);
          }
          if (imgPath) {
            imagePaths.add(imgPath);
          }
        }
      }
    }

    console.log(`Collected ${imagePaths.size} unique image paths`);

    // Create archive stream
    const archive = archiver('tar', {
      gzip: true,
      gzipOptions: { level: 6 }
    });

    // Track archive errors
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      throw err;
    });

    // Add Excel files to archive
    const mainBuffer = await mainWorkbook.xlsx.writeBuffer();
    const feedbackBuffer = await feedbackWorkbook.xlsx.writeBuffer();
    
    archive.append(Buffer.from(mainBuffer), { name: 'export/db_export.xlsx' });
    archive.append(Buffer.from(feedbackBuffer), { name: 'export/feedback_export.xlsx' });

    // Add images to archive
    let imagesAdded = 0;
    let imagesMissing = 0;
    
    for (const imgPath of imagePaths) {
      const fullPath = path.join(IMAGE_DIR, imgPath);
      if (existsSync(fullPath)) {
        archive.file(fullPath, { name: `export/images/${imgPath}` });
        imagesAdded++;
      } else {
        console.warn(`Image not found: ${fullPath}`);
        imagesMissing++;
      }
    }

    console.log(`Added ${imagesAdded} images to archive, ${imagesMissing} missing`);

    // Finalize archive
    archive.finalize();

    // Convert stream to buffer for response
    const chunks: Buffer[] = [];
    archive.on('data', (chunk) => chunks.push(chunk));

    await new Promise((resolve, reject) => {
      archive.on('end', resolve);
      archive.on('error', reject);
    });

    const archiveBuffer = Buffer.concat(chunks);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('-').slice(0, 3).join('') + '_' + new Date().toTimeString().split(' ')[0].replace(/:/g, '');
    const fileName = `selfie_export_${timestamp}.tar.gz`;

    console.log('Export complete:', fileName);

    return new NextResponse(archiveBuffer, {
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': archiveBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
