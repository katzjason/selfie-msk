import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";

export const runtime = "nodejs";

function contentTypeFor(ext: string) {
  switch (ext) {
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".webp": return "image/webp";
    default: return "application/octet-stream";
  }
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { path: parts } = await ctx.params;
    const imageDir = process.env.IMAGE_DIR ?? "/data/images";
    const rel = parts.join("/");

    // Prevent path traversal
    const abs = path.resolve(imageDir, rel);
    const base = path.resolve(imageDir);
    if (!abs.startsWith(base + path.sep) && abs !== base) {
      return NextResponse.json({ ok: false, error: "Invalid path" }, { status: 400 });
    }

    const buf = await fs.readFile(abs);
    const ext = path.extname(abs).toLowerCase();

    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentTypeFor(ext),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
}
