import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

/**
 * Refreshes the Supabase session from cookies and returns an updated response.
 *
 * Uses getSession() (local cookie read, no network call) for the userId check
 * so middleware never makes an outbound call to Supabase auth API.
 * Server components use getUser() directly for verified user data.
 */
export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  userId: string | null;
}> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getSession() reads from cookies locally — no outbound network call.
  // This is intentional: middleware only needs to know if a session exists.
  // Actual user verification (getUser) happens inside server components.
  const { data: { session } } = await supabase.auth.getSession();

  return { response, userId: session?.user?.id ?? null };
}
