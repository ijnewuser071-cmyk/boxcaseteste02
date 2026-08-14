import Link from "next/link";
import { redirect } from "next/navigation";
import { CartBuilder } from "@/components/cart/CartBuilder";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CartPage({ searchParams }: { searchParams: Promise<{ plan?: string; product?: string; addons?: string }> }) {
  const { plan: requestedPlan, product, addons } = await searchParams;
  const next = product ? `/carrinho?product=${encodeURIComponent(product)}&addons=${encodeURIComponent(addons ?? "")}` : `/carrinho?plan=${encodeURIComponent(requestedPlan ?? "")}`;
  const supabase = await getSupabaseServerClient();
  if (!supabase) redirect(`/login?error=configuracao&next=${encodeURIComponent(next)}`);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?mode=signup&next=${encodeURIComponent(next)}&plan=${encodeURIComponent(requestedPlan ?? "")}`);
  const frequency = Number((requestedPlan ?? "").replace("x", ""));
  if (!product && !frequency) redirect("/dashboard#planos");
  let query = supabase.from("plans").select("code,name,frequency_per_week,price_cents").eq("active", true);
  query = product ? query.eq("code", product) : query.eq("frequency_per_week", frequency).like("code", "box-%");
  const { data } = await query.single();
  const plan = data as { code: string; name: string; frequency_per_week: number; price_cents: number } | null;
  if (!plan) redirect("/dashboard#planos");
  return <main className="cart-page"><header><div className="cart-header-start"><Link href="/" className="logo"><span>B</span><strong className="display">BOX</strong></Link><Link href="/" className="cart-home-link" aria-label="Voltar ao início"><span aria-hidden="true">←</span> Voltar ao início</Link></div><div className="cart-step"><span>Etapa 1 de 2</span><strong>CARRINHO</strong></div></header><CartBuilder initialAddonCodes={(addons ?? "").split(",").filter(Boolean)} plan={{ code: plan.code, name: plan.name, frequency: plan.frequency_per_week, priceCents: plan.price_cents }} /></main>;
}
