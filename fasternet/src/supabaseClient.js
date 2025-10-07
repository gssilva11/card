import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.REACT_APP_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
  "";

const SUPABASE_ANON_KEY =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  process.env.REACT_APP_SUPABASE_KEY || // você usou essa em .env.local
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_KEY ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_KEY) ||
  "";

if (!SUPABASE_URL) {
  console.error("[supabaseClient] REACT_APP_SUPABASE_URL (ou equivalente) NÃO encontrada.");
}
if (!SUPABASE_ANON_KEY) {
  console.error("[supabaseClient] REACT_APP_SUPABASE_ANON_KEY / REACT_APP_SUPABASE_KEY (ou equivalente) NÃO encontrada.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export default supabase;
