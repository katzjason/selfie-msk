import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

export const runtime = "nodejs"; 

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file = data.get("image") as Blob;
    if (!file) {
        return NextResponse.json({ ok: false, error: "No image file provided", status: 400},
    )};

    const bytes = Buffer.from(await file.arrayBuffer());
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "quality-"));
    const imgPath = path.join(tmpDir, "image.png");
    await fs.writeFile(imgPath, bytes);

    // const py = spawn("python3", ["image-quality/analyzer_v1.py", "--folder_path", tmpDir], {
    //   cwd: process.cwd(),
    // });

    const py = spawn("/opt/venv/bin/python3", ["image-quality/analyzer_v1.py", "--folder_path", tmpDir], {
      cwd: process.cwd(),
      env: { ...process.env, PATH: `/opt/venv/bin:${process.env.PATH}` },
    });

    let out = "";
    let err = "";
    py.stdout.on("data", (d) => (out += d.toString())); // Script prints to stdout
    py.stderr.on("data", (d) => (err += d.toString()));

    
    const code: number = await new Promise((resolve, reject) => {
      py.on("close", resolve);
      py.on("error", reject);
    });
  
    // Cleanup temp
    await fs.rm(tmpDir, { recursive: true, force: true });

    if (code !== 0) {
      return NextResponse.json(
        { ok: false, error: "Python script failed", details: err || out },
        { status: 500 }
      );
    }

    const result = JSON.parse(out);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
      return NextResponse.json(
        { ok: false, error: e?.message ?? "Unknown error" },
        { status: 400 }
      );
  }
}
