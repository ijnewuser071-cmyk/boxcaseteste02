import Link from "next/link";
import { redirect } from "next/navigation";
import { PixCheckout } from "@/components/payment/PixCheckout";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCartTotals } from "@/lib/addons";

export const dynamic = "force-dynamic";

export default async function PaymentPage({ searchParams }: { searchParams: Promise<{ plan?: string; product?: string; addons?: string }> }) {
  const { plan: requestedPlan, product, addons: rawAddons } = await searchParams;
  const supabase = await getSupabaseServerClient();
  if (!supabase) redirect("/login?error=configuracao&next=/dashboard");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const nextQuery = new URLSearchParams();
    if (product) nextQuery.set("product", product);
    else nextQuery.set("plan", requestedPlan ?? "");
    if (rawAddons) nextQuery.set("addons", rawAddons);
    redirect(`/login?mode=signup&next=${encodeURIComponent(`/pagamento?${nextQuery}`)}&plan=${encodeURIComponent(requestedPlan ?? "")}`);
  }
  const frequency = Number((requestedPlan ?? "").replace("x", ""));
  if (!product && !frequency) redirect("/dashboard#planos");
  let planQuery = supabase.from("plans").select("id,code,name,frequency_per_week,price_cents").eq("active", true);
  planQuery = product ? planQuery.eq("code", product) : planQuery.eq("frequency_per_week", frequency).like("code", "box-%");
  const { data: rawPlan } = await planQuery.single();
  const plan = rawPlan as { id: string; name: string; frequency_per_week: number; price_cents: number } | null;
  if (!plan) redirect("/dashboard#planos");
  const totals = getCartTotals(plan.price_cents, (rawAddons ?? "").split(",").filter(Boolean));

  const txid = `BOX${crypto.randomUUID().replaceAll("-", "").slice(0, 18).toUpperCase()}`;
  return <main className="payment-page"><header><Link href="/" className="logo"><span>B</span><strong className="display">BOX</strong></Link><div><span>Etapa 2 de 2</span><strong>PIX</strong></div></header><PixCheckout txid={txid} addonCodes={totals.addons.map((item) => item.code)} items={totals.addons.map((item) => item.name)} discountCents={totals.discountCents} plan={{ id: plan.id, name: plan.name, frequency: plan.frequency_per_week, priceCents: totals.totalCents }} /></main>;
}
