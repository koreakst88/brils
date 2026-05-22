import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const envPath = path.resolve(process.cwd(), "apps/admin/.env");
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_string: `
      ALTER TABLE public.inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_type_check;
      ALTER TABLE public.inventory_transactions ADD CONSTRAINT inventory_transactions_type_check CHECK (type in ('incoming', 'outgoing', 'adjustment'));
    `
  });
  if (error) {
    console.error("Error:", error);
    // Let's try inserting with 'incoming'/'outgoing' and a note if this fails.
  } else {
    console.log("Success:", data);
  }
}
run();
