"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { createPlan, listPlans, updatePlan, type PlanInput } from "@/services/plans.service";
import { queuePromotion } from "@/services/notification-queue.service";
import type { ClientRow, PlanRow } from "@/types/database";

type AdminTab = "plans" | "payments" | "messages";
type PaymentReview = { id: string; amount_cents: number; pix_txid: string; status: string; reported_paid_at: string | null; clients: { name: string; phone: string | null } | null; plans: { name: string } | null };

const emptyPlan: PlanInput = { code: "", name: "", frequency_per_week: 3, price_cents: 0, price_per_class_cents: null, description: "", featured: false, active: true, sort_order: 0 };

export function AdminConsole() {
  const [tab, setTab] = useState<AdminTab>("plans");
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [payments, setPayments] = useState<PaymentReview[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [editing, setEditing] = useState<PlanRow | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return setStatus("Supabase não configurado.");
    setLoading(true);
    const [plansResult, clientsResult, paymentsResult] = await Promise.all([
      listPlans(supabase, true),
      supabase.from("clients").select("*").order("name"),
      supabase.from("payment_requests").select("id,amount_cents,pix_txid,status,reported_paid_at,clients(name,phone),plans(name)").order("created_at", { ascending: false }),
    ]);
    if (plansResult.data) setPlans(plansResult.data);
    if (clientsResult.data) setClients(clientsResult.data as ClientRow[]);
    if (paymentsResult.data) setPayments(paymentsResult.data as unknown as PaymentReview[]);
    const error = plansResult.error || clientsResult.error?.message || paymentsResult.error?.message;
    if (error) setStatus(`Não foi possível carregar tudo: ${error}`);
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadData(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function savePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    const input: PlanInput = {
      code: String(form.get("code") ?? "").trim(),
      name: String(form.get("name") ?? "").trim(),
      frequency_per_week: Number(form.get("frequency")),
      price_cents: Math.round(Number(form.get("price")) * 100),
      price_per_class_cents: form.get("pricePerClass") ? Math.round(Number(form.get("pricePerClass")) * 100) : null,
      description: String(form.get("description") ?? "").trim() || null,
      featured: form.get("featured") === "on",
      active: form.get("active") === "on",
      sort_order: Number(form.get("sortOrder")) || 0,
    };
    const result = editing ? await updatePlan(supabase, editing.id, input) : await createPlan(supabase, input);
    if (result.error) return setStatus(result.error);
    setStatus(editing ? "Plano atualizado com sucesso." : "Plano criado com sucesso.");
    setEditing(null);
    (event.currentTarget as HTMLFormElement).reset();
    await loadData();
  }

  async function togglePlan(plan: PlanRow) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const result = await updatePlan(supabase, plan.id, { active: !plan.active });
    setStatus(result.error ?? (plan.active ? "Plano desativado." : "Plano reativado."));
    await loadData();
  }

  async function sendPromotion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();
    if (!selectedClients.length) return setStatus("Selecione pelo menos um contato.");
    const result = await queuePromotion(supabase, selectedClients, title, message);
    if (result.error) return setStatus(result.error);
    setStatus(`${result.data?.length ?? 0} aviso(s) adicionado(s) à fila. Nenhuma mensagem foi enviada ainda.`);
    setSelectedClients([]);
    event.currentTarget.reset();
  }

  async function confirmPayment(paymentId: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase.rpc("confirm_pix_payment" as never, { payment_request_id: paymentId } as never);
    setStatus(error ? error.message : "Pagamento confirmado e plano ativado por 30 dias.");
    await loadData();
  }

  const eligibleClients = clients.filter((client) => client.phone && client.whatsapp_opt_in && client.status !== "blocked");
  const planDefaults = editing ?? emptyPlan;

  return <div className="admin-console">
    <div className="admin-tabs" role="tablist"><button type="button" role="tab" aria-selected={tab === "plans"} onClick={() => setTab("plans")}>Planos e valores</button><button type="button" role="tab" aria-selected={tab === "payments"} onClick={() => setTab("payments")}>Pagamentos Pix</button><button type="button" role="tab" aria-selected={tab === "messages"} onClick={() => setTab("messages")}>Avisos aos clientes</button></div>
    {status && <div className="admin-status" role="status">{status}<button type="button" onClick={() => setStatus("")}>×</button></div>}
    {loading ? <div className="admin-loading">Carregando dados do Supabase...</div> : tab === "plans" ? <section className="admin-workspace">
      <div className="admin-list"><div className="admin-section-head"><div><span>Catálogo</span><h2 className="display">Planos cadastrados</h2></div><strong>{plans.length}</strong></div>{plans.map((plan) => <article className="admin-plan-row" key={plan.id}><div><small>{plan.code}</small><h3>{plan.name}</h3><p>{plan.frequency_per_week}x por semana • {(plan.price_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div><span className={plan.active ? "active" : "inactive"}>{plan.active ? "Ativo" : "Inativo"}</span><div className="row-actions"><button type="button" onClick={() => setEditing(plan)}>Editar</button><button type="button" onClick={() => togglePlan(plan)}>{plan.active ? "Desativar" : "Ativar"}</button></div></article>)}</div>
      <form className="admin-form" onSubmit={savePlan} key={editing?.id ?? "new"}><div><span>{editing ? "Edição" : "Novo cadastro"}</span><h2 className="display">{editing ? "Alterar plano" : "Cadastrar plano"}</h2></div><label>Código<input name="code" required defaultValue={planDefaults.code} placeholder="box-3x" /></label><label>Nome<input name="name" required defaultValue={planDefaults.name} placeholder="Plano 3x" /></label><div className="form-pair"><label>Treinos por semana<input name="frequency" required type="number" min="1" defaultValue={planDefaults.frequency_per_week} /></label><label>Ordem<input name="sortOrder" type="number" defaultValue={planDefaults.sort_order} /></label></div><div className="form-pair"><label>Valor mensal (R$)<input name="price" required type="number" min="0" step="0.01" defaultValue={planDefaults.price_cents / 100} /></label><label>Valor por treino (R$)<input name="pricePerClass" type="number" min="0" step="0.01" defaultValue={(planDefaults.price_per_class_cents ?? 0) / 100} /></label></div><label>Descrição<textarea name="description" defaultValue={planDefaults.description ?? ""} rows={3} /></label><div className="form-checks"><label><input name="featured" type="checkbox" defaultChecked={planDefaults.featured} /> Plano em destaque</label><label><input name="active" type="checkbox" defaultChecked={planDefaults.active} /> Plano ativo</label></div><button className="button" type="submit">{editing ? "Salvar alterações" : "Cadastrar plano"}</button>{editing && <button className="cancel-edit" type="button" onClick={() => setEditing(null)}>Cancelar edição</button>}</form>
    </section> : tab === "payments" ? <section className="payment-review-list"><div className="admin-section-head"><div><span>Conferência manual</span><h2 className="display">Pagamentos informados</h2></div><strong>{payments.filter((payment) => payment.status === "under_review").length}</strong></div>{payments.length ? payments.map((payment) => <article key={payment.id}><div><small>{payment.pix_txid}</small><h3>{payment.clients?.name ?? "Cliente"}</h3><p>{payment.plans?.name ?? "Plano"} • {(payment.amount_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div><span className={`payment-status ${payment.status}`}>{payment.status === "under_review" ? "Conferir" : payment.status === "paid" ? "Pago" : payment.status}</span>{payment.status === "under_review" && <button type="button" onClick={() => confirmPayment(payment.id)}>Confirmar pagamento e ativar</button>}</article>) : <p className="empty-admin-state">Nenhum pagamento Pix foi informado.</p>}</section> : <section className="message-workspace">
      <div className="contact-picker"><div className="admin-section-head"><div><span>Destinatários com opt-in</span><h2 className="display">Selecionar contatos</h2></div><strong>{selectedClients.length}/{eligibleClients.length}</strong></div><label className="select-all"><input aria-label="Selecionar todos os contatos" type="checkbox" checked={eligibleClients.length > 0 && selectedClients.length === eligibleClients.length} onChange={(event) => setSelectedClients(event.target.checked ? eligibleClients.map((client) => client.id) : [])} /> Selecionar todos</label><div className="contact-list">{eligibleClients.length ? eligibleClients.map((client) => <label key={client.id}><input aria-label={`Selecionar ${client.name}`} type="checkbox" checked={selectedClients.includes(client.id)} onChange={(event) => setSelectedClients((current) => event.target.checked ? [...current, client.id] : current.filter((id) => id !== client.id))} /><span><strong>{client.name}</strong><small>{client.phone}</small></span></label>) : <p>Nenhum cliente com telefone e autorização de WhatsApp.</p>}</div></div>
      <form className="admin-form message-form" onSubmit={sendPromotion}><div><span>Nova comunicação</span><h2 className="display">Criar aviso</h2></div><label>Título interno<input name="title" required placeholder="Promoção de agosto" /></label><label>Mensagem<textarea name="message" required rows={7} placeholder="Escreva o aviso que será usado no template aprovado..." /></label><div className="queue-notice"><strong>Envio seguro</strong><p>Esta ação adiciona os avisos à fila. O WhatsApp só será acionado depois que as credenciais, o template aprovado e o agendamento forem configurados.</p></div><button className="button" type="submit">Adicionar à fila →</button></form>
    </section>}
  </div>;
}
