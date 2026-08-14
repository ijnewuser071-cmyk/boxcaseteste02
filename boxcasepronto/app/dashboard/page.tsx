import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { PlanManager } from "@/components/dashboard/PlanManager";
import { CustomerAddons } from "@/components/dashboard/CustomerAddons";
import { modalities } from "@/lib/constants";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { hasAdminAccess } from "@/lib/auth/roles";
import type { ClientRow, NotificationRow, PaymentRequestRow, SubscriptionRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ plan?: string; payment?: string }> }) {
  const params = await searchParams;
  const supabase = await getSupabaseServerClient();
  if (!supabase) redirect("/login?error=configuracao&next=/dashboard");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?mode=login&next=/dashboard");

  const { data: rawProfile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const isAdmin = hasAdminAccess(user.id, (rawProfile as { role: string } | null)?.role);
  const { data: rawClient } = await supabase.from("clients").select("*").eq("user_id", user.id).maybeSingle();
  const client = rawClient as ClientRow | null;
  const { data: rawSubscription } = client
    ? await supabase.from("subscriptions").select("*").eq("client_id", client.id).in("status", ["active", "past_due"]).order("ends_at", { ascending: false }).limit(1).maybeSingle()
    : { data: null };
  const subscription = rawSubscription as SubscriptionRow | null;
  const { data: rawPayment } = client
    ? await supabase.from("payment_requests").select("*").eq("client_id", client.id).in("status", ["pending", "under_review"]).order("created_at", { ascending: false }).limit(1).maybeSingle()
    : { data: null };
  const payment = rawPayment as PaymentRequestRow | null;
  const { data: rawNotifications } = client
    ? await supabase.from("notifications").select("*").eq("client_id", client.id).eq("channel", "app").order("created_at", { ascending: false }).limit(8)
    : { data: [] };
  const notifications = (rawNotifications ?? []) as NotificationRow[];

  const fullName = typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : user.email?.split("@")[0] ?? "Atleta";
  const firstName = fullName.split(" ")[0];
  const storedPlan = typeof user.user_metadata.selected_plan === "string" ? user.user_metadata.selected_plan : undefined;
  const selectedAddons = Array.isArray(user.user_metadata.selected_addons) ? user.user_metadata.selected_addons.filter((value: unknown): value is string => typeof value === "string") : [];
  const suggestedPlan = params.plan && ["3x", "4x", "5x", "6x"].includes(params.plan) ? params.plan : undefined;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = subscription ? new Date(`${subscription.starts_at}T00:00:00`) : null;
  const endDate = subscription ? new Date(`${subscription.ends_at}T00:00:00`) : null;
  const daysActive = startDate ? Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / 86_400_000)) : 0;
  const daysRemaining = endDate ? Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / 86_400_000)) : 0;
  const totalDays = startDate && endDate ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000)) : 30;
  const progress = Math.min(100, Math.round((daysActive / totalDays) * 100));

  return <main className="dashboard">
    <aside className="dash-sidebar"><Link href="/" className="logo"><span>B</span><strong className="display">BOX</strong></Link><nav><a className="active" href="#inicio">Visão geral</a><a href="#planos">Upgrade de plano</a><a href="#descontos">Descontos</a><a href="#modalidades">Conhecer modalidades</a>{isAdmin && <Link className="admin-nav-link" href="/admin">Painel administrativo</Link>}</nav><LogoutButton /></aside>
    <section className="dash-main">
      <header><div><span>Área do aluno</span><h1 className="display">Olá, {firstName}!</h1></div><div className="avatar">{firstName.charAt(0).toUpperCase()}</div></header>
      {isAdmin && <Link href="/admin" className="admin-entry-banner"><div><span>Acesso liberado</span><strong>Gerenciar Box</strong></div><b>Abrir painel administrativo →</b></Link>}
      {params.payment === "reported" && <div className="payment-return-banner" role="status"><div><span>Pix informado</span><strong>Recebemos sua confirmação de pagamento.</strong></div><p>O administrador fará a conferência e o plano será ativado na sua dashboard.</p></div>}
      {suggestedPlan && suggestedPlan !== storedPlan && <div className="pending-plan-banner"><div><span>Plano escolhido no site</span><strong>{suggestedPlan} por semana</strong></div><p>Confirme sua escolha abaixo ou compare com as outras opções.</p></div>}
      <section className="membership-overview" id="inicio">
        {subscription ? <><div className="membership-copy"><span className="eyebrow">Seu plano está ativo</span><h2 className="display">{subscription.plan_name}</h2><p>Válido até {endDate?.toLocaleDateString("pt-BR")}. Você pode renovar ou fazer upgrade a qualquer momento.</p></div><div className="membership-countdown"><strong className="display">{daysRemaining}</strong><span>{daysRemaining === 1 ? "dia restante" : "dias restantes"}</span><small>{daysActive} {daysActive === 1 ? "dia utilizado" : "dias utilizados"}</small></div><div className="membership-progress" aria-label={`${progress}% do ciclo utilizado`}><span style={{ width: `${progress}%` }} /></div></> : payment ? <div className="membership-copy"><span className="eyebrow">Pagamento em análise</span><h2 className="display">Estamos conferindo seu Pix.</h2><p>Assim que o administrador confirmar, seu ciclo de 30 dias aparecerá automaticamente aqui.</p></div> : <div className="membership-copy"><span className="eyebrow">Comece por aqui</span><h2 className="display">Escolha seu primeiro plano.</h2><p>Após o Pix e a confirmação do administrador, seu contador será ativado automaticamente.</p></div>}
      </section>
      <section className="dashboard-notifications" aria-labelledby="notifications-title">
        <div className="dash-title"><div><span className="eyebrow">Atualizações do seu plano</span><h2 className="display" id="notifications-title">Avisos do Box</h2></div><strong>{notifications.length}</strong></div>
        <div className="notification-card-list">
          {notifications.length ? notifications.map((notification) => <article key={notification.id} className={`notification-card ${notification.kind}`}>
            <div className="notification-icon" aria-hidden="true">{notification.kind === "payment" ? "✓" : "!"}</div>
            <div><span>{notification.kind === "payment" ? "Pagamento" : "Vencimento"}</span><h3>{notification.title ?? "Aviso do Box"}</h3><p>{notification.message}</p><small>{new Date(notification.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</small></div>
          </article>) : <div className="notification-empty"><strong>Tudo em dia.</strong><p>Os avisos de pagamento e vencimento aparecerão aqui.</p></div>}
        </div>
      </section>
      <section className="dash-section" id="planos"><div className="dash-title"><div><span className="eyebrow">Sua evolução</span><h2 className="display">Planos disponíveis</h2></div><p>Sem taxa de matrícula</p></div><PlanManager initialPlan={storedPlan} activePlan={subscription?.plan_code} /></section>
      <section className="dash-section" id="descontos"><div className="dash-title"><div><span className="eyebrow">Escolha por modalidade</span><h2 className="display">Modalidades em cards</h2></div><p>Compre uma separada ou monte seu combo</p></div><CustomerAddons initialCodes={selectedAddons} /></section>
      <section className="dash-section" id="modalidades"><div className="dash-title"><div><span className="eyebrow">Você escolhe</span><h2 className="display">Modalidades</h2></div></div><div className="dash-modality-grid">{modalities.map((modality)=><article key={modality.name}><span>{modality.index}</span><small>{modality.tag}</small><h3 className="display">{modality.name}</h3><p>{modality.description}</p></article>)}</div></section>
      <section className="included" id="beneficios"><h2 className="display">Tudo incluso.</h2><div>{["Acompanhamento de coaches","Acesso às instalações","Adaptação individual","Comunidade do Box","Avaliação inicial","Ambiente ao ar livre"].map((item)=><span key={item}>✓ {item}</span>)}</div></section>
    </section>
  </main>;
}
