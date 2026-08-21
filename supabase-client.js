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
  async getCurrentProfile() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return { data: null, error: new Error("Not signed in") };
    return supabaseClient.from("profiles").select("*").eq("id", user.id).maybeSingle();
  },
  async getMyBroadcasts() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return { data: [], error: new Error("Not signed in") };
    return supabaseClient.from("broadcasts").select("*").eq("broadcaster_id", user.id).order("created_at", { ascending: false });
  },
  async getFollowerCount(broadcasterId) {
    return supabaseClient.from("follows").select("*", { count: "exact", head: true }).eq("broadcaster_id", broadcasterId);
  },
  async getCommentCountForBroadcasts(broadcastIds) {
    if (!broadcastIds.length) return { count: 0, error: null };
    return supabaseClient.from("comments").select("*", { count: "exact", head: true }).in("broadcast_id", broadcastIds);
  },
  async updateProfile(profileId, updates) {
    return supabaseClient.from("profiles").update(updates).eq("id", profileId).select().single();
  },
  async changePassword(password) {
    return supabaseClient.auth.updateUser({ password });
  },
  async getComments(broadcastId) {
    return supabaseClient.from("comments").select("id, body, parent_id, created_at, author_id, profiles(username, first_name, last_name)").eq("broadcast_id", broadcastId).order("created_at", { ascending: true });
  },
  async addComment({ broadcastId, authorId, body, parentId = null }) {
    return supabaseClient.from("comments").insert({ broadcast_id: broadcastId, author_id: authorId, body, parent_id: parentId }).select().single();
  },
  async toggleLike(broadcastId, userId, liked) {
    if (liked) return supabaseClient.from("broadcast_likes").delete().match({ broadcast_id: broadcastId, user_id: userId });
    return supabaseClient.from("broadcast_likes").insert({ broadcast_id: broadcastId, user_id: userId });
  },
  async toggleFollow(broadcasterId, listenerId, following) {
    if (following) return supabaseClient.from("follows").delete().match({ broadcaster_id: broadcasterId, listener_id: listenerId });
    return supabaseClient.from("follows").insert({ broadcaster_id: broadcasterId, listener_id: listenerId });
  },
  async getLiveBroadcasts() {
    return supabaseClient.from("broadcasts").select("*, profiles!broadcasts_broadcaster_id_fkey(church_name, username, logo_url)").eq("status", "live").order("started_at", { ascending: false });
  },
  async getPublishedBroadcasts() {
    return supabaseClient.from("broadcasts").select("*, profiles!broadcasts_broadcaster_id_fkey(church_name, username, logo_url)").eq("status", "published").order("created_at", { ascending: false });
  }
};