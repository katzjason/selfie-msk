import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, unlink } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    // Get the PGPASSWORD from request body or environment
    const body = await request.json();
    const lastMonths = body.lastMonths || 'all'; // '1', '2', '3', '6', or 'all'
    const phiAllowed = body.phiAllowed === "All"; // true if "All", false otherwise
    const goodQualityOnly = body.goodQualityOnly === "Good quality only"; // true if filtering for good quality

    const pgPassword = body.pgPassword || process.env.PGPASSWORD || 'app_password';

    // Execute the export script
    const scriptPath = path.join(process.cwd(), 'export.sh');
    const exportDir = path.join(process.cwd(), 'export');

    console.log('Starting export...');
    
    // Run the export script with password and filter parameters
    const { stdout, stderr } = await execAsync(
      `PGPASSWORD=${pgPassword} LAST_MONTHS=${lastMonths || 'all'} PHI_ALLOWED=${phiAllowed ? 'true' : 'false'} GOOD_QUALITY_ONLY=${goodQualityOnly ? 'true' : 'false'} bash ${scriptPath}`,
      {
        cwd: process.cwd(),
        timeout: 300000, // 5 minute timeout
      }
    );

    console.log('Export script output:', stdout);
    if (stderr) console.error('Export script stderr:', stderr);

    // Find the generated tar.gz file
    // The script names it like: selfie_export_YYYYMMDD_HHMMSS.tar.gz
    const { stdout: lsOutput } = await execAsync(`ls -t ${exportDir}/../selfie_export_*.tar.gz | head -1`);
    const tarFilePath = lsOutput.trim();

    if (!existsSync(tarFilePath)) {
      throw new Error('Export file not found');
    }

    // Read the file
    const fileBuffer = await readFile(tarFilePath);
    const fileName = path.basename(tarFilePath);

    // Clean up the generated file after a delay (optional)
    setTimeout(async () => {
      try {
        await unlink(tarFilePath);
        console.log('Cleaned up export file:', tarFilePath);
      } catch (err) {
        console.error('Failed to clean up export file:', err);
      }
    }, 5000);

    // Return the file as a download
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
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
