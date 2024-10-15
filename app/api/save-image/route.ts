import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create the pics directory if it doesn't exist
    const picsDir = join(process.cwd(), "public", "pics");

    // Save the file
    const filename = image.name;
    const filepath = join(picsDir, filename);
    await writeFile(filepath, new Uint8Array(buffer));

    return NextResponse.json({ success: true, filename });
  } catch (error) {
    console.error("Error saving image:", error);
    return NextResponse.json(
      { error: "Failed to save image" },
      { status: 500 }
    );
  }
}
