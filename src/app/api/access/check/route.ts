import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getClientIp } from "@/lib/utils";
import { LIMITS } from "@/lib/types";

export async function GET() {
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

      if (!creditData) {
        await serviceClient.from("user_credits").insert({
          user_id: user.id,
          credits_remaining: LIMITS.AUTHENTICATED_CREDITS,
        });

        return NextResponse.json({
          allowed: true,
          credits: LIMITS.AUTHENTICATED_CREDITS,
          resetAt: null,
        });
      }

      if (
        creditData.reset_at &&
        new Date(creditData.reset_at) <= new Date()
      ) {
        await serviceClient
          .from("user_credits")
          .update({
            credits_remaining: LIMITS.AUTHENTICATED_CREDITS,
            reset_at: null,
          })
          .eq("user_id", user.id);

        return NextResponse.json({
          allowed: true,
          credits: LIMITS.AUTHENTICATED_CREDITS,
          resetAt: null,
        });
      }

      return NextResponse.json({
        allowed: creditData.credits_remaining > 0,
        credits: creditData.credits_remaining,
        resetAt: creditData.reset_at,
      });
    }

    const { data: ipData } = await serviceClient
      .from("ip_usage")
      .select("used")
      .eq("ip_address", ip)
      .single();

    if (ipData?.used) {
      return NextResponse.json({
        allowed: false,
        requiresAuth: true,
        reason: "Free trial used. Please sign in to continue.",
      });
    }

    return NextResponse.json({
      allowed: true,
      isGuest: true,
    });
  } catch (error) {
    console.error("Access check error:", error);
    return NextResponse.json(
      { error: "Failed to check access" },
      { status: 500 }
    );
  }
}
