import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getClientIp, isValidFileType, isValidFileSize } from "@/lib/utils";
import { LIMITS } from "@/lib/types";
import Tesseract from "tesseract.js";

async function validatePdfPageCount(buffer: Buffer): Promise<number> {
  try {
    const pdfParse = await import("pdf-parse");
    const data = await pdfParse.default(buffer);
    return data.numpages;
  } catch {
    return 1;
  }
}

async function performOcr(
  buffer: Buffer,
  mimeType: string
): Promise<{ text: string; diagrams: string[] }> {
  try {
    if (mimeType === "application/pdf") {
      const pdfParse = await import("pdf-parse");
      const data = await pdfParse.default(buffer);
      return { text: data.text, diagrams: [] };
    }

    const base64 = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const result = await Tesseract.recognize(dataUrl, "eng", {
      logger: () => {},
    });

    return { text: result.data.text, diagrams: [] };
  } catch (error) {
    console.error("OCR error:", error);
    return { text: "", diagrams: [] };
  }
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const ip = getClientIp(headersList);
    const supabase = await createClient();
    const serviceClient = createServiceClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: creditData } = await serviceClient
        .from("user_credits")
        .select("credits_remaining, reset_at")
        .eq("user_id", user.id)
        .single();

      if (
        creditData?.reset_at &&
        new Date(creditData.reset_at) <= new Date()
      ) {
        await serviceClient
          .from("user_credits")
          .update({
            credits_remaining: LIMITS.AUTHENTICATED_CREDITS,
            reset_at: null,
          })
          .eq("user_id", user.id);
      } else if (creditData && creditData.credits_remaining <= 0) {
        return NextResponse.json(
          { error: "No credits remaining", resetAt: creditData.reset_at },
          { status: 403 }
        );
      }
    } else {
      const { data: ipData } = await serviceClient
        .from("ip_usage")
        .select("used")
        .eq("ip_address", ip)
        .single();

      if (ipData?.used) {
        return NextResponse.json(
          { error: "Free trial used", requiresAuth: true },
          { status: 403 }
        );
      }
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    if (files.length > LIMITS.MAX_FILES_PER_SUBMISSION) {
      return NextResponse.json(
        { error: `Maximum ${LIMITS.MAX_FILES_PER_SUBMISSION} files allowed` },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (!isValidFileType(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}` },
          { status: 400 }
        );
      }

      if (!isValidFileSize(file.size)) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Max ${LIMITS.MAX_FILE_SIZE_MB}MB` },
          { status: 400 }
        );
      }

      if (file.type === "application/pdf") {
        const buffer = Buffer.from(await file.arrayBuffer());
        const pageCount = await validatePdfPageCount(buffer);
        if (pageCount > LIMITS.MAX_PDF_PAGES) {
          return NextResponse.json(
            { error: `PDF has too many pages: ${file.name}. Max ${LIMITS.MAX_PDF_PAGES} pages` },
            { status: 400 }
          );
        }
      }
    }

    let combinedText = "";
    const allDiagrams: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      const filePath = `${user?.id || ip}/${Date.now()}-${file.name}`;
      await serviceClient.storage
        .from("temp-uploads")
        .upload(filePath, buffer, {
          contentType: file.type,
        });

      await serviceClient.from("uploaded_files").insert({
        user_id: user?.id || null,
        ip_address: ip,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
      });

      const result = await performOcr(buffer, file.type);
      combinedText += result.text + "\n\n";
      allDiagrams.push(...result.diagrams);
    }

    if (user) {
      const { data: currentCredits } = await serviceClient
        .from("user_credits")
        .select("credits_remaining")
        .eq("user_id", user.id)
        .single();

      const newCredits = (currentCredits?.credits_remaining ?? LIMITS.AUTHENTICATED_CREDITS) - 1;
      const resetAt =
        newCredits === 0
          ? new Date(Date.now() + LIMITS.CREDIT_RESET_HOURS * 60 * 60 * 1000).toISOString()
          : null;

      await serviceClient
        .from("user_credits")
        .update({
          credits_remaining: newCredits,
          last_used_at: new Date().toISOString(),
          reset_at: resetAt || undefined,
        })
        .eq("user_id", user.id);
    } else {
      await serviceClient.from("ip_usage").upsert({
        ip_address: ip,
        used: true,
        used_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      text: combinedText.trim(),
      diagrams: allDiagrams,
    });
  } catch (error) {
    console.error("Process error:", error);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}
