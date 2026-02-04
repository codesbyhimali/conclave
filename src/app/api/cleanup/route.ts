import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CLEANUP_SECRET_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: oldFiles, error: fetchError } = await serviceClient
      .from("uploaded_files")
      .select("id, file_path")
      .lt("created_at", cutoffTime);

    if (fetchError) {
      throw fetchError;
    }

    if (!oldFiles || oldFiles.length === 0) {
      return NextResponse.json({
        message: "No files to clean up",
        deletedCount: 0,
      });
    }

    const filePaths = oldFiles.map((f: { file_path: string }) => f.file_path);
    const fileIds = oldFiles.map((f: { id: string }) => f.id);

    const { error: storageError } = await serviceClient.storage
      .from("temp-uploads")
      .remove(filePaths);

    if (storageError) {
      console.error("Storage cleanup error:", storageError);
    }

    const { error: dbError } = await serviceClient
      .from("uploaded_files")
      .delete()
      .in("id", fileIds);

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json({
      message: "Cleanup completed",
      deletedCount: oldFiles.length,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 }
    );
  }
}
