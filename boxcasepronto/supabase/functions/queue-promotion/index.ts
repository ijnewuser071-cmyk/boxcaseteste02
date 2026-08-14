import { json, requireAutomationSecret } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";

type PromotionInput = { title: string; message: string; scheduledAt?: string; clientIds?: string[] };

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!requireAutomationSecret(request)) return json({ error: "Unauthorized" }, 401);

  try {
    const input = await request.json() as PromotionInput;
    if (!input.title?.trim() || !input.message?.trim()) return json({ error: "title and message are required" }, 400);
    const supabase = createAdminClient();
    let query = supabase.from("clients").select("id").eq("whatsapp_opt_in", true).not("phone", "is", null).neq("status", "blocked");
    if (input.clientIds?.length) query = query.in("id", input.clientIds);
    const { data: clients, error: clientsError } = await query;
    if (clientsError) throw clientsError;
    const rows = (clients ?? []).map((client) => ({
      client_id: client.id,
      kind: "promotion",
      channel: "whatsapp",
      title: input.title.trim(),
      message: input.message.trim(),
      status: input.scheduledAt ? "scheduled" : "queued",
      scheduled_at: input.scheduledAt ?? new Date().toISOString(),
      metadata: { source: "promotion_api" },
    }));
    if (!rows.length) return json({ queued: 0 });
    const { error } = await supabase.from("notifications").insert(rows);
    if (error) throw error;
    return json({ queued: rows.length });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
