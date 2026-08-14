import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { hasAdminAccess } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

function safeNext(value?: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ mode?: string; next?: string; plan?: string; reset?: string; registered?: string }> }) {
  const params = await searchParams;
  const nextPath = safeNext(params.next);
  const supabase = await getSupabaseServerClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (data.user && supabase) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    if (hasAdminAccess(data.user.id, (profile as { role?: string } | null)?.role)) redirect("/admin");
    redirect(nextPath.startsWith("/admin") ? "/dashboard" : nextPath);
  }

  const initialMessage = params.reset === "success"
    ? "Senha alterada com sucesso. Entre com sua nova senha."
    : params.registered === "confirm"
      ? "Cadastro criado! Confirme sua conta pelo e-mail recebido e depois faça login."
      : params.registered === "success"
        ? "Cadastro criado com sucesso. Entre com seu e-mail e senha."
        : undefined;

  return <main className="auth-page"><section className="auth-story"><Link href="/" className="logo"><span>B</span><strong className="display">BOX</strong></Link><div><span className="auth-story-kicker">Mossoró • RN</span><h2 className="display">Seu treino.<br/><em>Seu ritmo.</em><br/>Sua evolução.</h2><p>Uma conta para acompanhar seus planos, combinar modalidades e cuidar da sua experiência no Box.</p><ul><li>✓ Altere planos e pacotes</li><li>✓ Consulte modalidades</li><li>✓ Acompanhe benefícios</li></ul></div><Link href="/#planos" className="auth-back">← Voltar para os planos</Link></section><section className="auth-panel"><AuthForm initialMode={params.mode === "signup" ? "signup" : "login"} nextPath={nextPath} selectedPlan={params.plan} initialMessage={initialMessage} /></section></main>;
}
