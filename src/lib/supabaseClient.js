import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tmbedodneqrredpwhmrb.supabase.co";
const supabaseAnonKey = "sb_publishable__Zfh4wE1WRO2HgtEspSNOQ_-NW6uZTw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);