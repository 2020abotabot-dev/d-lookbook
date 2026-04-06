import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// Temporary debug endpoint — REMOVE BEFORE LAUNCH
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const { data: userData,    error: userError }    = await supabase.auth.getUser();

    const session = sessionData?.session;
    const user    = userData?.user;

    let publicUser  = null;
    let publicError = null;

    if (user?.id) {
      const service = createServiceClient();
      const { data, error } = await service
        .from("users")
        .select("id, tenant_id, role, tenants(id, name, slug)")
        .eq("id", user.id)
        .single();
      publicUser  = data;
      publicError = error?.message ?? null;
    }

    return NextResponse.json({
      hasSession:     !!session,
      sessionError:   sessionError?.message ?? null,
      hasUser:        !!user,
      userEmail:      user?.email ?? null,
      emailConfirmed: user?.email_confirmed_at ?? null,
      userError:      userError?.message ?? null,
      hasPublicUser:  !!publicUser,
      publicUser,
      publicError,
      cookies: request.cookies.getAll().map(c => ({
        name:  c.name,
        size:  c.value.length,
      })),
      env: {
        testMode:       process.env.NEXT_PUBLIC_TEST_MODE,
        supabaseUrl:    process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "missing",
        supabaseAnon:   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "missing",
        serviceRole:    process.env.SUPABASE_SERVICE_ROLE_KEY ? "set" : "missing",
      },
    }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
