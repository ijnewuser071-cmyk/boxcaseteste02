import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClientRow, Database } from "@/types/database";
import type { ServiceResult } from "./service-result";
import { serviceUnavailable } from "./service-result";

export async function listClients(client: SupabaseClient<Database> | null): Promise<ServiceResult<ClientRow[]>> {
  if (!client) return serviceUnavailable();
  const { data, error } = await client.from("clients").select("*").order("created_at", { ascending: false });
  return error ? { data: null, error: error.message } : { data, error: null };
}

export async function getClientById(client: SupabaseClient<Database> | null, id: string): Promise<ServiceResult<ClientRow>> {
  if (!client) return serviceUnavailable();
  const { data, error } = await client.from("clients").select("*").eq("id", id).single();
  return error ? { data: null, error: error.message } : { data, error: null };
}
