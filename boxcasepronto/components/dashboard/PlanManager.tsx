"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatBRL, plans } from "@/lib/constants";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function PlanManager({ initialPlan, activePlan }: { initialPlan?: string; activePlan?: string }) {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState(initialPlan ?? "");
  const [pendingPlan, setPendingPlan] = useState("");
  const [message, setMessage] = useState("");

  async function choosePlan(frequency: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return setMessage("Supabase ainda não configurado.");
    setPendingPlan(frequency);
    const { error } = await supabase.auth.updateUser({ data: { selected_plan: frequency } });
    setPendingPlan("");
    if (error) return setMessage("Não foi possível alterar o plano agora.");
    setCurrentPlan(frequency);
    setMessage(`Plano ${frequency} selecionado. Redirecionando para o Pix...`);
    router.push(`/carrinho?plan=${encodeURIComponent(frequency)}`);
  }

  return <><div className="dash-plan-grid">{plans.map((plan) => {
    const selected = currentPlan === plan.frequency;
    const isActive = activePlan === plan.frequency;
    const action = "Adicionar ao carrinho";
    return <article key={plan.frequency} className={isActive || selected ? "selected" : ""}>{isActive ? <small>Plano ativo</small> : selected && <small>Selecionado</small>}<strong className="display">{plan.frequency}</strong><span>por semana</span><b>{formatBRL(plan.price)}<i>/mês</i></b><p>{plan.perClass}</p><button type="button" disabled={pendingPlan === plan.frequency} onClick={() => choosePlan(plan.frequency)}>{pendingPlan === plan.frequency ? "Preparando Pix..." : action}</button></article>;
  })}</div>{message && <p className="plan-feedback" role="status">{message}</p>}</>;
}
