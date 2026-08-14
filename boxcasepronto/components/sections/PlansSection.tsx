import Link from "next/link";
import { formatBRL, plans } from "@/lib/constants";
import { getSupabasePublicServerClient } from "@/lib/supabase/server";
import { listPlans } from "@/services/plans.service";
import { SelvaPassCalculator } from "./SelvaPassCalculator";

export async function PlansSection() {
  const result = await listPlans(getSupabasePublicServerClient());
  const displayPlans = result.data?.length ? result.data.map((plan) => ({
    code: plan.code,
    name: plan.name.replace("Box Selva", "Box"),
    category: plan.code.startsWith("box-") ? "Box · Funcional" : plan.code.startsWith("jiujitsu-") ? "BTT Medeiros · Jiu-Jitsu" : plan.code.startsWith("lpo-") ? "Lift Hard · LPO Cross" : plan.code.startsWith("forca-") ? "Lift Hard · Força" : "Modalidade do Box",
    frequency: `${plan.frequency_per_week}x`, price: plan.price_cents / 100,
    perClass: plan.price_per_class_cents ? `${formatBRL(plan.price_per_class_cents / 100)} por treino` : plan.description || "Consulte as condições",
    featured: plan.featured,
  })) : plans.map((plan) => ({ ...plan, code: `box-${plan.frequency}`, name: `Plano Box ${plan.frequency}`, category: "Box · Funcional" }));

  return <section className="section plans" id="planos"><div className="container"><div className="plans-head"><div><span className="eyebrow">Planos e modalidades</span><h2 className="display section-title">Escolha o que quer treinar.</h2></div><p>Adicione modalidades separadamente e monte seu combo no carrinho.</p></div><div className="shopping-trust"><span>1. Escolha com calma</span><span>2. Revise no carrinho</span><span>3. Pague somente ao finalizar</span></div><div className="plan-grid">{displayPlans.map((plan) => <article className={`plan-card ${plan.featured ? "featured" : ""}`} key={plan.code}><span className="card-corner" aria-hidden="true"/>{plan.featured && <span className="popular">Mais escolhido</span>}<div className="plan-identity"><small>{plan.category}</small><h3 className="display">{plan.name}</h3></div><div className="plan-frequency"><strong className="display">{plan.frequency}</strong><span>check-ins<br/>por semana</span></div><hr/><p className="price"><small>a partir de</small><b>{formatBRL(plan.price)}</b><span>/mês</span></p><p className="per-class">{plan.perClass}</p><Link className={`button ${plan.featured ? "" : "button-dark"}`} href={`/carrinho?product=${encodeURIComponent(plan.code)}`}>Adicionar ao carrinho <span>→</span></Link><small className="card-reassurance">Você poderá alterar antes do Pix</small></article>)}</div><SelvaPassCalculator /></div></section>;
}
