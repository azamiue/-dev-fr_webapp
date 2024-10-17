import { NextResponse } from "next/server";
import fs from "fs"; // Regular fs for streams
import fsPromises, { mkdir } from "fs/promises"; // fs.promises for async file system methods
import path from "path";
import archiver from "archiver";

export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Email not provided" },
        { status: 400 }
      );
    }

    const zipsDir = path.join(process.cwd(), "app", "src", "zips");
    const picsDir = path.join(process.cwd(), "app", "src", "pics", name);
    await mkdir(zipsDir, { recursive: true });
    const zipFilePath = path.join(zipsDir, `${name}.zip`);

    return new Promise<Response>((resolve) => {
      const output = fs.createWriteStream(zipFilePath); // Use fs.createWriteStream
      const archive = archiver("zip", {
        zlib: { level: 9 }, // Sets the compression level.
      });

      output.on("close", async function () {
        try {
          // Remove the email-specific folder after zipping
          await fsPromises.rm(picsDir, { recursive: true, force: true }); // Use fs.promises for rm
        } catch (err) {
          console.error(`Error deleting folder ${picsDir}:`, err);
          resolve(
            NextResponse.json(
              {
                success: false,
                error: "Failed to delete folder after zipping",
              },
              { status: 500 }
            )
          );
        }

        resolve(
          NextResponse.json({
            success: true,
            message: `Zip file created successfully for ${name}, folder deleted.`,
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

      // Add the files from the email-specific pics directory, excluding zip files
      archive.glob("**/*", {
        cwd: picsDir,
      });

      archive.finalize();
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
