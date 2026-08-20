const toast = document.querySelector("#toast");
const showToast = () => {
  toast.classList.add("show");
  window.clearTimeout(window.toastTimer);
  window.toastTimer = window.setTimeout(() => toast.classList.remove("show"), 4200);
};

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
    if (target !== "overview") showToast();
  });
});