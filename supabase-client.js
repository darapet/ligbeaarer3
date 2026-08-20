/* The anon key is designed for browser use. Database safety comes from RLS in schema.sql. */
const supabaseClient = window.supabase.createClient(window.SONORA_CONFIG.url, window.SONORA_CONFIG.anonKey);

window.Sonora = {
  supabase: supabaseClient,
  async signUp({ email, password, username, firstName, lastName, accountType = "listener" }) {
    return supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { username, first_name: firstName, last_name: lastName, account_type: accountType } }
    });
  },
  async signIn(email, password) {
    return supabaseClient.auth.signInWithPassword({ email, password });
  },
  async signOut() {
    return supabaseClient.auth.signOut();
  },
  async getLiveBroadcasts() {
    return supabaseClient.from("broadcasts").select("*, profiles(church_name, username, logo_url)").eq("status", "live").order("started_at", { ascending: false });
  },
  async getPublishedBroadcasts() {
    return supabaseClient.from("broadcasts").select("*, profiles(church_name, username, logo_url)").eq("status", "published").order("created_at", { ascending: false });
  }
};