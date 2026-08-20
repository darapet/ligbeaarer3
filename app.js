const toast = document.querySelector("#toast");
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
    document.querySelector("#miniPlayer").classList.toggle("visible", target === "listen");
    if (target !== "overview" && target !== "listen") showToast();
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
});

document.querySelectorAll(".filter-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".filter-pill").forEach((item) => item.classList.remove("active"));
    pill.classList.add("active");
  });
});