import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { stat } from "fs/promises";
import path from "path";

// New way to configure the API route
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Get fileName from query parameters
    const fileName = req.nextUrl.searchParams.get("fileName");

    if (!fileName) {
      return NextResponse.json(
        { message: "Filename is required" },
        { status: 400 }
      );
    }

    const filePath = path.join(
      process.cwd(),
      "app",
      "src",
      "zips",
      `${fileName}.zip`
    );

    // Check if file exists
    try {
      await stat(filePath);
    } catch (error) {
      return NextResponse.json({ message: "File not found" }, { status: 404 });
    }

    // Read the file
    const fileBuffer = await readFile(filePath);

    // Create a new FormData instance
    const formData = new FormData();
    formData.append("file", new Blob([fileBuffer]), `${fileName}.zip`);

    // Forward the request to the external API
    const apiResponse = await fetch("http://localhost:5000/send-zip", {
      method: "POST",
      body: formData,
    });

    if (!apiResponse.ok) {
      throw new Error(`API responded with status: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error forwarding zip file:", error);
    return NextResponse.json(
      { message: "Error forwarding zip file" },
      { status: 500 }
    );
  }
}
