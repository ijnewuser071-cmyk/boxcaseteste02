"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function RecoveryCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Validando seu link de recuperação...");

  useEffect(() => {
    let active = true;
    async function exchange() {
      const code = searchParams.get("code");
      const supabase = getSupabaseBrowserClient();
      if (!code || !supabase) {
        if (active) setMessage("Este link está incompleto ou não é mais válido.");
        return;
      }
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!active) return;
      if (error) {
        setMessage("Este link expirou ou já foi utilizado. Solicite uma nova recuperação.");
        return;
      }
      router.replace("/redefinir-senha");
      router.refresh();
    }
    void exchange();
    return () => { active = false; };
  }, [router, searchParams]);

  return <div className="recovery-callback" role="status"><span className="recovery-spinner" aria-hidden="true"/><strong>{message}</strong><a href="/login?mode=login">Voltar ao login</a></div>;
}
