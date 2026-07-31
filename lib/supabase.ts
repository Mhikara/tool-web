import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.https://wahfvbmptambkgasbcia.supabase.co;
const supabaseKey = process.env.sb_publishable_n7GwD-Vv_JQqPh9us82p5A_YOHTJ_2C;

export const supabase = createClient(supabaseUrl, supabaseKey);
