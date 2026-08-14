"use client";

import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton({ className = "dash-logout", label = "Sair da conta ↗" }: { className?: string; label?: string }) {
  const router = useRouter();
  return <button type="button" className={className} onClick={async () => { await getSupabaseBrowserClient()?.auth.signOut(); router.push("/"); router.refresh(); }}>{label}</button>;
}
