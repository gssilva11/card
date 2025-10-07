import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL ou KEY não encontradas nas variáveis de ambiente");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
