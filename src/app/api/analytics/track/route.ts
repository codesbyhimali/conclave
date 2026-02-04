import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getClientIp } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const ip = getClientIp(headersList);
    const supabase = await createClient();
    const serviceClient = createServiceClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { eventType, metadata = {} } = body;

    if (!eventType) {
      return NextResponse.json(
        { error: "Event type required" },
        { status: 400 }
      );
    }

    await serviceClient.from("analytics_events").insert({
      event_type: eventType,
      user_id: user?.id || null,
      ip_address: ip,
      metadata,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}
