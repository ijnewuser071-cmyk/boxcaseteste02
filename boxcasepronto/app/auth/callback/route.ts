import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { hasAdminAccess } from "@/lib/auth/roles";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/dashboard";
  const supabase = await getSupabaseServerClient();
  if (code && supabase) {
    if (next.startsWith("/redefinir-senha")) {
      const recovery = new URL("/auth/recovery", url.origin);
      recovery.searchParams.set("code", code);
      return NextResponse.redirect(recovery);
    }
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
        if (hasAdminAccess(user.id, (profile as { role?: string } | null)?.role)) return NextResponse.redirect(new URL("/admin", url.origin));
      }
      return NextResponse.redirect(new URL(next.startsWith("/admin") ? "/dashboard" : next, url.origin));
    }
  }
  return NextResponse.redirect(new URL("/login?error=confirmacao", url.origin));
}
