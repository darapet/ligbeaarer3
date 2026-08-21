const landing = document.querySelector("#landingScreen");
const authModal = document.querySelector("#authModal");
const wizardModal = document.querySelector("#wizardModal");
const openAuth = (mode = "listener", signin = false) => {
  authModal.classList.add("show");
  document.querySelectorAll("[data-account]").forEach((button) => button.classList.toggle("selected", button.dataset.account === mode));
  document.querySelector("#authTitle").textContent = mode === "broadcaster" ? "Build your gathering." : "Come on in.";
  document.querySelector("#authSub").textContent = mode === "broadcaster" ? "Create your broadcaster account and give your church a voice." : "Sign in to continue listening with your community.";
  const form = document.querySelector("#authForm");
  form.dataset.mode = signin ? "signin" : "signup";
  document.querySelector("#nameFields").style.display = signin ? "none" : "grid";
  document.querySelector("#authSubmit").innerHTML = signin ? "Sign in <span>↗</span>" : "Create account <span>↗</span>";
  document.querySelector("#authSwitch").innerHTML = signin ? 'New here? <button>Create an account</button>' : 'Already have an account? <button>Sign in</button>';
  document.querySelector("#authSwitch button").addEventListener("click", toggleAuthMode);
};
const enterApp = (view = "overview") => {
  authModal.classList.remove("show");
  landing.style.display = "none";
  document.querySelector(".app-shell").style.display = "flex";
  document.querySelector(`[data-view="${view}"]`)?.click();
  window.dispatchEvent(new CustomEvent("sonora:authenticated"));
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
document.querySelector("#landingLogin").addEventListener("click", () => openAuth("listener", true));
document.querySelector("#heroLogin").addEventListener("click", () => openAuth("listener", true));
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

let authSubmitting = false;
let authCooldownTimer;
document.querySelector("#authForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (authSubmitting) return;
  authSubmitting = true;
  const submitButton = document.querySelector("#authSubmit");
  const originalButtonText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.textContent = "Connecting…";
  const form = new FormData(event.currentTarget);
  const accountType = document.querySelector("[data-account].selected").dataset.account;
  const isSignin = event.currentTarget.dataset.mode === "signin";
  let result;
  try {
    if (window.Sonora) {
      result = isSignin
        ? await window.Sonora.signIn(form.get("email"), form.get("password"))
        : await window.Sonora.signUp({ email: form.get("email"), password: form.get("password"), username: form.get("username"), firstName: form.get("firstName"), lastName: form.get("lastName"), accountType });
      if (result.error) {
        const isRateLimited = result.error.status === 429 || /rate limit|too many requests/i.test(result.error.message || "");
        const isFetchError = /fetch|network|failed to fetch/i.test(result.error.message || "");
        document.querySelector("#authSub").textContent = isRateLimited
          ? "Supabase is temporarily limiting new signups. Wait a few minutes, then try once—or use Sign in if this email was already registered."
          : isFetchError
            ? "Supabase could not be reached. Confirm the project API URL is https://jzrcxjjcsohyxqzebgda.supabase.co, then refresh this page."
          : result.error.message;
        if (isRateLimited) {
          let seconds = 30;
          submitButton.textContent = `Try again in ${seconds}s`;
          clearInterval(authCooldownTimer);
          authCooldownTimer = setInterval(() => {
            seconds -= 1;
            submitButton.textContent = seconds > 0 ? `Try again in ${seconds}s` : originalButtonText;
            if (seconds <= 0) {
              clearInterval(authCooldownTimer);
              authCooldownTimer = null;
              submitButton.disabled = false;
            }
          }, 1000);
        }
        return;
      }
    }
    // Supabase may accept the signup but require email confirmation first.
    // Do not send a user into the app without an authenticated session.
    if (!isSignin && !result?.data?.session) {
      openAuth(accountType, true);
      document.querySelector("#authSub").textContent =
        "Check your email to confirm your account, then sign in to continue.";
      return;
    }
    if (accountType === "broadcaster") {
      window.dispatchEvent(new CustomEvent("sonora:authenticated"));
      openWizard();
    }
    else enterApp("listen");
  } catch (error) {
    document.querySelector("#authSub").textContent = "We couldn’t reach Supabase right now. Check your connection and try again.";
  } finally {
    authSubmitting = false;
    if (!authCooldownTimer) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    } else {
      setTimeout(() => { submitButton.disabled = false; }, 30000);
    }
  }
});

const wizardPages = [
  '<p class="eyebrow">BROADCAST SETUP · 02</p><h2>Connect your audio.</h2><p class="wizard-sub">Choose your microphone and check the signal before going live.</p><div class="mic-test"><div class="mic-icon">♩</div><div><strong>Default microphone</strong><small>Browser audio input</small></div><span class="sound-bars">▂ ▅ ▇ ▅ ▂</span></div><button class="test-button" id="micTestButton">Allow microphone & test <span>▶</span></button><div class="equalizer" id="micMeter"><span>LEVEL</span><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><p class="mic-status" id="micStatus">Your microphone test is private and is not saved.</p><div class="sound-controls sound-controls-large"><label>Volume <input type="range" min="0" max="100" value="80" /></label><label>Echo <input type="range" min="0" max="100" value="12" /></label></div><div class="wizard-actions"><button class="button button-dark next-step">Continue <span>→</span></button></div>',
  '<p class="eyebrow">BROADCAST SETUP · 03</p><h2>You’re ready to share.</h2><p class="wizard-sub">Your channel is ready. Go live and your listeners can join in real time.</p><div class="ready-card"><span>✦</span><div><strong>Your broadcast</strong><small>Ready for listeners to join</small></div><i class="ready-check">✓</i></div><div class="studio-preview"><span class="preview-wave">〰〰〰〰〰</span><small>Live audio console ready</small></div><div class="wizard-actions"><button class="button button-dark finish-broadcast"><span class="live-dot"></span> Go live <span>↗</span></button></div>'
];
let wizardStep = 0;
wizardModal.addEventListener("click", (event) => {
  if (event.target.closest("#micTestButton")) {
    startMicTest();
    return;
  }
  if (!event.target.closest(".next-step")) return;
  if (wizardStep === 0) {
    const inputs = document.querySelectorAll("#wizardBody input");
    const titleInput = inputs[0];
    window.sonoraBroadcastTitle = titleInput?.value.trim() || "Untitled broadcast";
    window.sonoraBroadcastVenue = inputs[1]?.value.trim() || "";
  }
  wizardStep += 1;
  document.querySelector("#wizardBody").innerHTML = wizardPages[wizardStep - 1];
  document.querySelectorAll(".wizard-steps i").forEach((item, index) => item.classList.toggle("active", index <= wizardStep));
});

let audioContext;
let micStream;
let micAnimation;
const startMicTest = async () => {
  const status = document.querySelector("#micStatus");
  const button = document.querySelector("#micTestButton");
  if (!navigator.mediaDevices?.getUserMedia) {
    status.textContent = "Microphone access is not available in this browser.";
    return;
  }
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(micStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const bars = [...document.querySelectorAll("#micMeter i")];
    const animate = () => {
      analyser.getByteFrequencyData(data);
      bars.forEach((bar, index) => {
        const level = Math.max(12, Math.min(75, data[index * 2] / 2));
        bar.style.height = `${level}px`;
      });
      micAnimation = requestAnimationFrame(animate);
    };
    animate();
    button.innerHTML = "Microphone is working <span>✓</span>";
    button.classList.add("testing");
    status.textContent = "Live input detected. Speak normally to check your level.";
  } catch {
    status.textContent = "Microphone permission was blocked. Allow it in your browser and try again.";
  }
};
const stopMicTest = () => {
  if (micAnimation) cancelAnimationFrame(micAnimation);
  micStream?.getTracks().forEach((track) => track.stop());
  audioContext?.close();
};
wizardModal.addEventListener("click", (event) => {
  if (!event.target.closest(".finish-broadcast")) return;
  stopMicTest();
  startLiveStudio();
});

let liveTimer;
const startLiveStudio = () => {
  const body = document.querySelector("#wizardBody");
  const title = window.sonoraBroadcastTitle || "Untitled broadcast";
  const venue = window.sonoraBroadcastVenue ? ` · ${window.sonoraBroadcastVenue.replace(/[<>&]/g, "")}` : "";
  body.innerHTML = `<div class="live-studio-head"><div><p class="eyebrow">YOU ARE LIVE</p><h2>${title.replace(/[<>&]/g, "")}</h2><p class="wizard-sub">${venue || "Live church audio"}</p></div><span class="live-pill"><i></i> LIVE <b id="liveTimer">00:00</b></span></div><div class="live-studio-wave"><div class="live-wave-large">〰〰〰〰〰</div><span>Live audio signal</span></div><div class="live-studio-stats"><div><strong id="liveListenerCount">0</strong><small>Listeners</small></div><div><strong id="liveCommentCount">0</strong><small>Comments</small></div><div><strong>00:00</strong><small>Duration</small></div></div><div class="live-controls"><label>Volume <input type="range" min="0" max="100" value="80" /></label><label>Bass <input type="range" min="-12" max="12" value="0" /></label><label>Treble <input type="range" min="-12" max="12" value="0" /></label><label>Echo <input type="range" min="0" max="100" value="12" /></label></div><div class="live-comments"><strong>Live comments</strong><span id="liveCommentMessage">Comments from listeners will appear here.</span></div><div class="wizard-actions"><button class="button button-end" id="endBroadcast">End broadcast</button></div>`;
  let seconds = 0;
  window.SonoraLiveKit?.join("abundant-grace-live", "broadcaster")
    .then(() => window.SonoraLiveKit.publishMicrophone())
    .then(() => {
      const status = document.querySelector(".live-comments span");
      if (status) status.textContent = "Live audio connected. Your listeners can hear you now.";
    })
    .catch((error) => {
      const status = document.querySelector(".live-comments span");
      if (status) status.textContent = error.message;
    });
  liveTimer = setInterval(() => {
    seconds += 1;
    const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
    const remaining = String(seconds % 60).padStart(2, "0");
    const timer = document.querySelector("#liveTimer");
    if (timer) timer.textContent = `${minutes}:${remaining}`;
  }, 1000);
};
wizardModal.addEventListener("click", (event) => {
  if (!event.target.closest("#endBroadcast")) return;
  clearInterval(liveTimer);
  window.SonoraLiveKit?.leave();
  document.querySelector("#wizardBody").innerHTML = '<div class="ended-state"><div>✓</div><p class="eyebrow">BROADCAST ENDED</p><h2>That was a beautiful gathering.</h2><p class="wizard-sub">Would you like to keep this audio available for your community?</p><div class="end-actions"><button class="button button-dark" id="saveBroadcast">Save broadcast</button><button class="button button-quiet" id="discardBroadcast">Don’t save</button></div></div>';
});
wizardModal.addEventListener("click", (event) => {
  if (!event.target.closest("#saveBroadcast, #discardBroadcast")) return;
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
  window.SonoraLiveKit?.join("abundant-grace-live", "listener").catch((error) => {
    document.querySelector("#playerTitle").dataset.error = error.message;
  });
};
document.querySelectorAll(".live-card, .discover-card").forEach((card) => {
  card.addEventListener("click", (event) => {
    if (!event.target.closest("button")) openPlayer(card);
  });
});
document.addEventListener("click", (event) => {
  const card = event.target.closest(".live-card, .discover-card");
  if (card && !event.target.closest("button")) openPlayer(card);
  if (event.target.closest(".round-play, .discover-play")) {
    event.stopPropagation();
    openPlayer(event.target.closest(".live-card, .discover-card"));
  }
});
document.querySelectorAll(".round-play, .discover-play").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    openPlayer(button.closest(".live-card, .discover-card"));
  });
});
document.querySelector("#backToListen").addEventListener("click", () => {
  playerModal.classList.remove("show");
  window.SonoraLiveKit?.leave();
});
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