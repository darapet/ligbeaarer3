const toast = document.querySelector("#toast");
let liveRefreshTimer = null;
const showToast = () => {
  toast.classList.add("show");
  window.clearTimeout(window.toastTimer);
  window.toastTimer = window.setTimeout(() => toast.classList.remove("show"), 4200);
};
window.sonoraShowToast = showToast;

document.querySelector("#startBroadcast").addEventListener("click", showToast);
document.querySelector("#setupBroadcast").addEventListener("click", showToast);
document.querySelector(".toast button").addEventListener("click", () => toast.classList.remove("show"));

document.querySelector(".mobile-menu").addEventListener("click", () => {
  document.querySelector(".sidebar").classList.toggle("open");
});

document.querySelectorAll("[data-view], [data-view-link]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
    const target = link.dataset.view || link.dataset.viewLink;
    document.querySelector(`[data-view="${target}"]`)?.classList.add("active");
    document.querySelector(".sidebar").classList.remove("open");
    document.querySelector(".page").style.display = target === "overview" ? "" : "none";
    document.querySelector("#listener-view").classList.toggle("visible", target === "listen");
    document.querySelector("#profile-settings").classList.toggle("visible", target === "profile");
    document.querySelector("#miniPlayer").classList.toggle("visible", target === "listen");
    if (liveRefreshTimer) {
      clearInterval(liveRefreshTimer);
      liveRefreshTimer = null;
    }
    if (target === "listen") {
      loadRealData().catch(() => {});
      liveRefreshTimer = setInterval(() => loadRealData().catch(() => {}), 8000);
    }
    if (!["overview", "listen", "profile"].includes(target)) showToast();
  });
});

document.querySelectorAll(".round-play, .discover-play").forEach((button) => {
  button.addEventListener("click", (event) => {
    const card = event.currentTarget.closest(".live-card, .discover-card");
    const title = card?.dataset.title || card?.querySelector("strong")?.textContent;
    if (title) document.querySelector("#nowPlaying").textContent = title;
    document.querySelector("#miniPlayer").classList.add("visible");
    document.querySelector("#playerPlay").textContent = "Ⅱ";
  });
});

document.querySelector("#playerPlay").addEventListener("click", (event) => {
  event.currentTarget.textContent = event.currentTarget.textContent === "▶" ? "Ⅱ" : "▶";
  window.SonoraLiveKit?.startAudio?.().catch(() => {});
});

document.querySelectorAll(".filter-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".filter-pill").forEach((item) => item.classList.remove("active"));
    pill.classList.add("active");
  });
});

const initials = (profile) => `${profile?.first_name?.[0] || ""}${profile?.last_name?.[0] || ""}`.toUpperCase() || "?";
const escapeHtml = (value = "") => String(value).replace(/[<>&"']/g, (character) => ({
  "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#039;"
}[character]));
const formatDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";

const renderBroadcast = (broadcast, type = "published") => {
  const title = escapeHtml(broadcast.title);
  const speaker = escapeHtml(broadcast.speaker || "");
  const venue = escapeHtml(broadcast.venue || "");
  const meta = [speaker, venue].filter(Boolean).join(" · ");
  if (type === "live") return `<article class="live-card" data-title="${title}" data-broadcast-id="${broadcast.id}"><div class="live-art live-art-one"><span class="live-badge"><i></i> LIVE</span><div class="live-wave">〰〰〰</div></div><div class="live-card-copy"><strong>${title}</strong><span>${meta || "Live broadcast"}</span><div><b>◉ ${Number(broadcast.listener_count || 0).toLocaleString()} listening</b><button class="round-play">▶</button></div></div></article>`;
  return `<article class="discover-card" data-title="${title}" data-broadcast-id="${broadcast.id}"><div class="discover-art discover-one">✦</div><strong>${title}</strong><span>${meta || formatDate(broadcast.created_at)}</span><button class="discover-play">▶</button></article>`;
};

const loadRealData = async () => {
  if (!window.Sonora) return;
  const [{ data: profile }, { data: ownBroadcasts }] = await Promise.all([
    window.Sonora.getCurrentProfile(),
    window.Sonora.getMyBroadcasts()
  ]);
  if (profile) {
    const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.username;
    const avatar = initials(profile);
    ["sidebarAvatar", "topAvatar"].forEach((id) => { const element = document.querySelector(`#${id}`); if (element) element.textContent = avatar; });
    document.querySelector("#sidebarName").textContent = displayName || "Your profile";
    document.querySelector("#topProfileName").textContent = displayName || "Your profile";
    document.querySelector("#sidebarType").textContent = profile.account_type === "broadcaster" ? "Broadcaster account" : "Listener account";
    document.querySelector("#dashboardName").textContent = `${profile.first_name || profile.username || "there"}.`;
    document.querySelectorAll("#profileForm [name]").forEach((field) => {
      field.value = profile[field.name] || (field.name === "theme_color" ? "#ff784f" : "");
    });
  }
  document.querySelector("#dashboardDate").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const broadcasts = ownBroadcasts || [];
  document.querySelector("#totalBroadcasts").textContent = broadcasts.length;
  document.querySelector("#totalListeners").textContent = broadcasts.reduce((total, item) => total + Number(item.listener_count || 0), 0).toLocaleString();
  const { count: commentCount } = await window.Sonora.getCommentCountForBroadcasts(broadcasts.map((item) => item.id));
  document.querySelector("#totalComments").textContent = Number(commentCount || 0).toLocaleString();
  if (profile) {
    const { count } = await window.Sonora.getFollowerCount(profile.id);
    document.querySelector("#totalFollowers").textContent = Number(count || 0).toLocaleString();
  }
  const recent = broadcasts.slice(0, 5);
  if (recent[0]) document.querySelector("#lastBroadcast").textContent = `Last broadcast · ${formatDate(recent[0].created_at)}`;
  document.querySelector("#recentBroadcasts").innerHTML = recent.length
    ? recent.map((item) => `<div class="broadcast-row"><div class="stream-art art-one"><span>✦</span></div><div class="stream-info"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.venue || "")} · ${formatDate(item.created_at)}</span></div><span class="stream-stat">◉ ${Number(item.listener_count || 0).toLocaleString()}</span><span class="stream-stat">${escapeHtml(item.status)}</span><span class="duration">${item.started_at ? formatDate(item.started_at) : "—"}</span></div>`).join("")
    : '<div class="empty-state">Your recent broadcasts will appear here.</div>';
  const [liveResult, publishedResult] = await Promise.all([window.Sonora.getLiveBroadcasts(), window.Sonora.getPublishedBroadcasts()]);
  const live = liveResult.data || [];
  const published = publishedResult.data || [];
  document.querySelector("#liveBroadcasts").innerHTML = liveResult.error
    ? `<div class="empty-state">Live broadcasts could not load: ${escapeHtml(liveResult.error.message)}</div>`
    : live.length
      ? live.map((item) => renderBroadcast(item, "live")).join("")
      : '<div class="empty-state">No live broadcasts right now.</div>';
  document.querySelector("#publishedBroadcasts").innerHTML = published.length ? published.map((item) => renderBroadcast(item)).join("") : '<div class="empty-state">Published broadcasts will appear here.</div>';
};

document.querySelector("#profileForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const { data: { user } } = await window.Sonora.supabase.auth.getUser();
  if (!user) return;
  const updates = Object.fromEntries(new FormData(event.currentTarget).entries());
  const { error } = await window.Sonora.updateProfile(user.id, updates);
  document.querySelector("#profileSaveMessage").textContent = error ? error.message : "Profile saved.";
  if (!error) loadRealData();
});
document.querySelector("#passwordForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = new FormData(event.currentTarget).get("password");
  const { error } = await window.Sonora.changePassword(password);
  document.querySelector("#passwordSaveMessage").textContent = error ? error.message : "Password updated.";
  if (!error) event.currentTarget.reset();
});

window.addEventListener("sonora:authenticated", loadRealData);
loadRealData().catch(() => {});