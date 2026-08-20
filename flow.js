const landing = document.querySelector("#landingScreen");
const authModal = document.querySelector("#authModal");
const wizardModal = document.querySelector("#wizardModal");
const openAuth = (mode = "listener") => {
  authModal.classList.add("show");
  document.querySelectorAll("[data-account]").forEach((button) => button.classList.toggle("selected", button.dataset.account === mode));
  document.querySelector("#authTitle").textContent = mode === "broadcaster" ? "Build your gathering." : "Come on in.";
  document.querySelector("#authSub").textContent = mode === "broadcaster" ? "Create your broadcaster account and give your church a voice." : "Sign in to continue listening with your community.";
};
const enterApp = (view = "overview") => {
  authModal.classList.remove("show");
  landing.style.display = "none";
  document.querySelector(".app-shell").style.display = "flex";
  document.querySelector(`[data-view="${view}"]`)?.click();
};
const openWizard = () => {
  landing.style.display = "none";
  document.querySelector(".app-shell").style.display = "flex";
  wizardStep = 0;
  wizardModal.classList.add("show");
};

document.querySelector("#broadcastCta").addEventListener("click", () => openAuth("broadcaster"));
document.querySelector("#listenCta").addEventListener("click", () => {
  landing.style.display = "none";
  document.querySelector(".app-shell").style.display = "flex";
  document.querySelector('[data-view="listen"]').click();
});
document.querySelector("#landingLogin").addEventListener("click", () => openAuth("listener"));
document.querySelector("#startBroadcast").addEventListener("click", openWizard);
document.querySelector("#setupBroadcast").addEventListener("click", openWizard);
document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => {
  authModal.classList.remove("show");
  wizardModal.classList.remove("show");
  playerModal?.classList.remove("show");
}));
document.querySelectorAll("[data-account]").forEach((button) => button.addEventListener("click", () => openAuth(button.dataset.account)));

const toggleAuthMode = () => {
  const form = document.querySelector("#authForm");
  const isSignIn = form.dataset.mode === "signin";
  form.dataset.mode = isSignIn ? "signup" : "signin";
  document.querySelector("#nameFields").style.display = isSignIn ? "none" : "grid";
  document.querySelector("#authSubmit").innerHTML = isSignIn ? "Create account <span>↗</span>" : "Sign in <span>↗</span>";
  document.querySelector("#authSwitch").innerHTML = isSignIn ? 'Already have an account? <button>Sign in</button>' : 'New here? <button>Create an account</button>';
  document.querySelector("#authSwitch button").addEventListener("click", toggleAuthMode);
};
document.querySelector("#authSwitch button").addEventListener("click", toggleAuthMode);

document.querySelector("#authForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const accountType = document.querySelector("[data-account].selected").dataset.account;
  const isSignin = event.currentTarget.dataset.mode === "signin";
  if (window.Sonora) {
    const result = isSignin
      ? await window.Sonora.signIn(form.get("email"), form.get("password"))
      : await window.Sonora.signUp({ email: form.get("email"), password: form.get("password"), username: form.get("username"), firstName: form.get("firstName"), lastName: form.get("lastName"), accountType });
    if (result.error) {
      document.querySelector("#authSub").textContent = result.error.message;
      return;
    }
  }
  if (accountType === "broadcaster") {
    authModal.classList.remove("show");
    wizardModal.classList.add("show");
  } else enterApp("listen");
});

const wizardPages = [
  '<p class="eyebrow">BROADCAST SETUP · 02</p><h2>Check your sound.</h2><p class="wizard-sub">Choose a microphone and make sure your voice is clear.</p><div class="mic-test"><div class="mic-icon">♩</div><div><strong>Built-in microphone</strong><small>Default audio input</small></div><span class="sound-bars">▂ ▅ ▇ ▅ ▂</span></div><button class="test-button">Test microphone <span>▶</span></button><div class="equalizer"><span>EQ</span><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="wizard-actions"><button class="button button-dark next-step">Continue <span>→</span></button></div>',
  '<p class="eyebrow">BROADCAST SETUP · 03</p><h2>Make it yours.</h2><p class="wizard-sub">A final look before you share this with your community.</p><div class="preview-card"><span class="live-badge"><i></i> PREVIEW</span><h3>Sunday Worship</h3><p>Pastor Daniel · Abundant Grace Chapel</p><div class="preview-wave">〰〰〰〰</div></div><div class="wizard-actions"><button class="button button-dark next-step">Continue <span>→</span></button></div>',
  '<p class="eyebrow">BROADCAST SETUP · 04</p><h2>You’re ready to share.</h2><p class="wizard-sub">Your community is waiting. You can adjust the studio controls while you’re live.</p><div class="ready-card"><span>✦</span><strong>Sunday Worship</strong><small>Not live yet · Abundant Grace Chapel</small></div><div class="wizard-actions"><button class="button button-dark finish-broadcast">Go live <span>↗</span></button></div>'
];
let wizardStep = 0;
wizardModal.addEventListener("click", (event) => {
  if (!event.target.closest(".next-step")) return;
  wizardStep += 1;
  document.querySelector("#wizardBody").innerHTML = wizardPages[wizardStep - 1];
  document.querySelectorAll(".wizard-steps i").forEach((item, index) => item.classList.toggle("active", index <= wizardStep));
});
wizardModal.addEventListener("click", (event) => {
  if (!event.target.closest(".finish-broadcast")) return;
  wizardModal.classList.remove("show");
  enterApp("overview");
  window.sonoraShowToast?.();
});

const playerModal = document.querySelector("#playerModal");
const openPlayer = (card) => {
  const title = card?.dataset.title || card?.querySelector("strong")?.textContent || "Live church audio";
  document.querySelector("#playerTitle").textContent = title;
  document.querySelector("#nowPlaying").textContent = title;
  playerModal.classList.add("show");
  document.querySelector("#miniPlayer").classList.add("visible");
};
document.querySelectorAll(".live-card, .discover-card").forEach((card) => {
  card.addEventListener("click", (event) => {
    if (!event.target.closest("button")) openPlayer(card);
  });
});
document.querySelectorAll(".round-play, .discover-play").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    openPlayer(button.closest(".live-card, .discover-card"));
  });
});
document.querySelector("#backToListen").addEventListener("click", () => playerModal.classList.remove("show"));
document.querySelector("#mainPlayerButton").addEventListener("click", (event) => {
  event.currentTarget.textContent = event.currentTarget.textContent === "▶" ? "Ⅱ" : "▶";
});
document.querySelector("#playerLike").addEventListener("click", (event) => {
  event.currentTarget.textContent = event.currentTarget.textContent === "♡" ? "♥" : "♡";
});
document.querySelector("#followButton").addEventListener("click", (event) => {
  const following = event.currentTarget.classList.toggle("following");
  event.currentTarget.textContent = following ? "✓ Following" : "+ Follow church";
});
document.querySelector("#playerShare").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(window.location.href); } catch {}
  window.sonoraShowToast?.();
});
document.querySelector("#commentForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = event.currentTarget.querySelector("input");
  const body = input.value.trim();
  if (!body) return;
  const item = document.createElement("div");
  item.innerHTML = `<i>YO</i><p><strong>You</strong><br />${body.replace(/[<>&]/g, "")}</p><span>♡</span>`;
  document.querySelector(".comment-list").appendChild(item);
  input.value = "";
});

document.querySelector(".app-shell").style.display = "none";