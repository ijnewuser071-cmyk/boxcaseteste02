import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminConsole } from "@/components/admin/AdminConsole";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { hasAdminAccess } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) redirect("/login?error=configuracao&next=/admin");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?mode=login&next=/admin");
  const { data: rawProfile } = await supabase.from("profiles").select("full_name,email,role").eq("id", user.id).single();
  const profile = rawProfile as { full_name: string | null; email: string | null; role: string } | null;
  if (!profile || !hasAdminAccess(user.id, profile.role)) redirect("/dashboard");
  const name = profile.full_name || profile.email || user.email || "Administrador";

  return <main className="admin-page"><aside className="dash-sidebar admin-sidebar"><Link href="/" className="logo"><span>B</span><strong className="display">BOX</strong></Link><div className="admin-identity"><span>Administrador</span><strong>{name}</strong></div><nav><Link className="active" href="/admin">Painel administrativo</Link><Link href="/dashboard">Área do aluno</Link><Link href="/">Visualizar site</Link></nav><LogoutButton /></aside><section className="admin-main"><header><div><span>Gestão do Box</span><h1 className="display">Central administrativa</h1><p>Planos, preços, clientes e comunicações em um só lugar.</p></div><div className="admin-badge">ADM</div></header><AdminConsole /></section></main>;
}
