import { mkdir, writeFile } from 'fs/promises';
import path from "path";
import { randomUUID } from 'crypto';

export const runtime = "nodejs";

export async function POST(req: Request) {
    const dir = process.env.IMAGE_DIR ?? "/data/images";
    await mkdir(dir, { recursive: true });

    const form = await req.formData();

    const file = form.get("file");
    if (!file || !(file instanceof File)) {
        return Response.json({ error: "Missing file" }, { status: 400 });
    }

    const ext = file.type === "image/png" ? "png"
        : file.type === "image/jpeg" ? "jpg"
        : file.type === "image/webp" ? "webp"
        : file.type === "image/heic" ? "heic"
        : null;

    if (!ext) {
        return Response.json({error: "Unsupported file type"}, {status: 415});
    }

    const id = randomUUID();
    console.log("Generated ID:", id);
    const filename = `${id}.${ext}`;
    const filepath = path.join(dir, filename);
    console.log("Saving file to:", filepath);

    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, bytes);

    return Response.json({
        id, filename, url: `/api/images/${filename}`
    });
}