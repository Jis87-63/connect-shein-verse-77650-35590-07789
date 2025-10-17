import { supabase as supabaseClient } from "@/integrations/supabase/client";

// Wrapper to bypass TypeScript errors while database types are regenerating
export const supabase = {
  from: (table: string) => (supabaseClient as any).from(table),
  auth: supabaseClient.auth,
  storage: supabaseClient.storage,
  channel: (name: string) => supabaseClient.channel(name),
  removeChannel: (channel: any) => supabaseClient.removeChannel(channel),
  rpc: (fn: string, params?: any) => (supabaseClient as any).rpc(fn, params),
};
