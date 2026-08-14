import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationRow } from "@/types/database";
import type { ServiceResult } from "./service-result";
import { serviceUnavailable } from "./service-result";

export async function queuePromotion(client: SupabaseClient | null, clientIds: string[], title: string, message: string): Promise<ServiceResult<NotificationRow[]>> {
  if (!client) return serviceUnavailable();
  if (!clientIds.length) return { data: [], error: null };
  const rows = clientIds.map((clientId) => ({ client_id: clientId, channel: "whatsapp" as const, kind: "promotion" as const, title, message, status: "queued" as const, scheduled_at: new Date().toISOString() }));
  const { data, error } = await client.from("notifications").insert(rows).select("*");
  return error ? { data: null, error: error.message } : { data: data as NotificationRow[], error: null };
}
