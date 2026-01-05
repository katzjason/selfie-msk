import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

function contentType(file: string) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

export async function GET(
  
  _req: Request,
  context: { params: Promise<{ filename: string }> }
) {
  const { filename } = await context.params;
  const baseDir = process.env.IMAGE_DIR ?? "/data/images";
  console.log(filename);
  const filePath = path.join(baseDir, filename);
  console.log(filePath);

  console.log("IN REQUEST");
  if (!fs.existsSync(filePath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const stream = fs.createReadStream(filePath);
  

  return new NextResponse(stream as any, {
    headers: {
      "Content-Type": contentType(filePath),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
