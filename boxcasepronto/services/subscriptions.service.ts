import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionRow } from "@/types/database";
import type { ServiceResult } from "./service-result";
import { serviceUnavailable } from "./service-result";

export type SubscriptionSummary = SubscriptionRow & { daysRemaining: number };

export async function getActiveSubscription(client: SupabaseClient | null, clientId: string): Promise<ServiceResult<SubscriptionSummary | null>> {
  if (!client) return serviceUnavailable();
  const { data, error } = await client.from("subscriptions").select("*").eq("client_id", clientId).in("status", ["active", "past_due"]).order("ends_at", { ascending: false }).limit(1).maybeSingle();
  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  const subscription = data as SubscriptionRow;
  const today = new Date();
  const end = new Date(`${subscription.ends_at}T23:59:59`);
  return { data: { ...subscription, daysRemaining: Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86_400_000)) }, error: null };
}
