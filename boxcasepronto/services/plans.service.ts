import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanRow } from "@/types/database";
import type { ServiceResult } from "./service-result";
import { serviceUnavailable } from "./service-result";

export type PlanInput = Pick<PlanRow, "code" | "name" | "frequency_per_week" | "price_cents" | "price_per_class_cents" | "description" | "featured" | "active" | "sort_order">;

export async function listPlans(client: SupabaseClient | null, includeInactive = false): Promise<ServiceResult<PlanRow[]>> {
  if (!client) return serviceUnavailable();
  let query = client.from("plans").select("*").order("sort_order").order("frequency_per_week");
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  return error ? { data: null, error: error.message } : { data: data as PlanRow[], error: null };
}

export async function createPlan(client: SupabaseClient | null, input: PlanInput): Promise<ServiceResult<PlanRow>> {
  if (!client) return serviceUnavailable();
  const { data, error } = await client.from("plans").insert(input).select("*").single();
  return error ? { data: null, error: error.message } : { data: data as PlanRow, error: null };
}

export async function updatePlan(client: SupabaseClient | null, id: string, input: Partial<PlanInput>): Promise<ServiceResult<PlanRow>> {
  if (!client) return serviceUnavailable();
  const { data, error } = await client.from("plans").update(input).eq("id", id).select("*").single();
  return error ? { data: null, error: error.message } : { data: data as PlanRow, error: null };
}
