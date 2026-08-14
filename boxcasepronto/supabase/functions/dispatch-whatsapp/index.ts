import { json, requireAutomationSecret } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";

type QueueItem = { id: string; kind: "promotion" | "expiration" | "payment" | "transactional"; message: string; attempt_count: number; metadata: Record<string, unknown> | null; clients: { name: string; phone: string } | null; notification_templates: { provider_template_name: string | null } | null };

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!requireAutomationSecret(request)) return json({ error: "Unauthorized" }, 401);

  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const graphVersion = Deno.env.get("WHATSAPP_GRAPH_VERSION");
  const templateLanguage = Deno.env.get("WHATSAPP_TEMPLATE_LANGUAGE") ?? "pt_BR";
  const promotionTemplate = Deno.env.get("WHATSAPP_PROMOTION_TEMPLATE_NAME");
  const paymentTemplate = Deno.env.get("WHATSAPP_PAYMENT_TEMPLATE_NAME");
  const expirationTemplate = Deno.env.get("WHATSAPP_EXPIRATION_TEMPLATE_NAME");
  if (!token || !phoneNumberId || !graphVersion) return json({ error: "WhatsApp credentials are not configured; nothing was sent." }, 503);

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("notifications")
    .select("id,kind,message,attempt_count,metadata,clients!inner(name,phone),notification_templates(provider_template_name)")
    .eq("channel", "whatsapp").in("status", ["queued", "scheduled"])
    .lte("scheduled_at", new Date().toISOString()).order("created_at").limit(50);
  if (error) return json({ error: error.message }, 500);

  let sent = 0;
  let failed = 0;
  for (const rawItem of data ?? []) {
    const item = rawItem as unknown as QueueItem;
    if (!item.clients?.phone) continue;
    const configuredTemplate = item.kind === "promotion"
      ? promotionTemplate
      : item.kind === "payment"
        ? paymentTemplate
        : item.kind === "expiration"
          ? expirationTemplate
          : null;
    const templateName = configuredTemplate ?? item.notification_templates?.provider_template_name;
    if (!templateName) {
      failed += 1;
      await supabase.from("notifications").update({ status: "failed", error_message: "Approved WhatsApp template is not configured." }).eq("id", item.id);
      continue;
    }
    const metadata = item.metadata ?? {};
    const parameterValues = item.kind === "promotion"
      ? [item.clients.name, item.message]
      : item.kind === "payment"
        ? [item.clients.name, String(metadata.plan_name ?? "Box")]
        : [item.clients.name, String(metadata.plan_name ?? "Box"), String(metadata.days_remaining ?? "")];
    const template = templateName === "hello_world"
      ? { name: templateName, language: { code: "en_US" } }
      : { name: templateName, language: { code: templateLanguage }, components: [{ type: "body", parameters: parameterValues.map((value) => ({ type: "text", text: value })) }] };
    await supabase.from("notifications").update({ status: "processing", last_attempt_at: new Date().toISOString(), attempt_count: item.attempt_count + 1 }).eq("id", item.id);
    const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: item.clients.phone.replace(/\D/g, ""), type: "template", template }),
    });
    const payload = await response.json() as { messages?: { id: string }[]; error?: { message?: string } };
    if (response.ok) {
      sent += 1;
      await supabase.from("notifications").update({ status: "sent", sent_at: new Date().toISOString(), provider_message_id: payload.messages?.[0]?.id ?? null, error_message: null }).eq("id", item.id);
    } else {
      failed += 1;
      await supabase.from("notifications").update({ status: "failed", error_message: payload.error?.message ?? `HTTP ${response.status}` }).eq("id", item.id);
    }
  }
  return json({ processed: (data ?? []).length, sent, failed });
});
