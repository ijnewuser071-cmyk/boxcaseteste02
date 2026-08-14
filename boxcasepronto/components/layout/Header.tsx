import Link from "next/link";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { hasAdminAccess } from "@/lib/auth/roles";

export async function Header() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  let isAdmin = false;

  if (user && supabase) {
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    isAdmin = hasAdminAccess(user.id, (data as { role?: string } | null)?.role);
  }

  const accountPath = isAdmin ? "/admin" : "/dashboard";

  return <header className="header"><div className="container header-inner">
    <Link href="/" className="logo"><span>B</span><strong className="display">BOX</strong></Link>
    <nav aria-label="Navegação principal"><a href="#modalidades">Modalidades</a><a href="#planos">Planos</a><Link href={user ? accountPath : "/login?mode=login&next=/dashboard"}>{isAdmin ? "Administração" : "Área do aluno"}</Link></nav>
    {user ? <div className="header-actions signed-in-actions"><Link className="account-button" href={accountPath}>{isAdmin ? "Painel admin" : "Minha conta"}</Link><LogoutButton className="header-logout-button" label="Sair" /></div> : <div className="header-actions"><Link className="login-link" href="/login?mode=login&next=/dashboard">Entrar <span>↗</span></Link><Link className="client-signup-button" href="/login?mode=signup&next=/dashboard">Criar conta</Link></div>}
  </div></header>;
}
