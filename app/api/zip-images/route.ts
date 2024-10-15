import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import archiver from "archiver";

export async function POST(): Promise<Response> {
  const publicDir = path.join(process.cwd(), "public");
  const picsDir = path.join(publicDir, "pics");
  const zipFilePath = path.join(publicDir, "pics", "face_images.zip");

  return new Promise<Response>((resolve, reject) => {
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level.
    });

    output.on("close", function () {
      console.log(archive.pointer() + " total bytes");
      console.log("Zip file created successfully at:", zipFilePath);

      resolve(
        NextResponse.json({
          success: true,
          message: "Zip file created successfully",
        })
      );
    });

    archive.on("error", function (err) {
      console.error("Error creating zip file:", err);
      resolve(
        NextResponse.json(
          { success: false, error: "Failed to create zip file" },
          { status: 500 }
        )
      );
    });

    archive.pipe(output);

    // Add the files from the pics directory, excluding the zip file itself
    archive.glob("**/*", {
      cwd: picsDir,
      ignore: ["face_images.zip"],
    });

    archive.finalize();
  });
}
