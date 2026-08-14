import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProfileRow } from "@/types/database";
import type { ServiceResult } from "./service-result";
import { serviceUnavailable } from "./service-result";

export async function getProfile(client: SupabaseClient<Database> | null, id: string): Promise<ServiceResult<ProfileRow>> {
  if (!client) return serviceUnavailable();
  const { data, error } = await client.from("profiles").select("*").eq("id", id).single();
  return error ? { data: null, error: error.message } : { data, error: null };
}
