
import { NextResponse } from "next/server";


export async function POST(req: Request) {
    const data = await req.formData(); // request FormData
    // extract all db fields?
    const images = data.get("images");

    


}


// Writes image to image volume
    // Get files


// Writes row to db