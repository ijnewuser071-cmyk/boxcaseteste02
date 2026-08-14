import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, NotificationChannel, NotificationRow } from "@/types/database";
import type { ServiceResult } from "./service-result";
import { serviceUnavailable } from "./service-result";

export async function listClientNotifications(client: SupabaseClient<Database> | null, clientId: string): Promise<ServiceResult<NotificationRow[]>> {
  if (!client) return serviceUnavailable();
  const { data, error } = await client.from("notifications").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
  return error ? { data: null, error: error.message } : { data, error: null };
}

export async function listNotificationsByChannel(client: SupabaseClient<Database> | null, channel: NotificationChannel): Promise<ServiceResult<NotificationRow[]>> {
  if (!client) return serviceUnavailable();
  const { data, error } = await client.from("notifications").select("*").eq("channel", channel).order("created_at", { ascending: false });
  return error ? { data: null, error: error.message } : { data, error: null };
}
