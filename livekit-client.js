window.SonoraLiveKit = (() => {
  let room;
  const remoteAudioElements = new Set();
  let sdk = window.LivekitClient || window.LiveKitClient || null;
  const tokenEndpoint = `${window.SONORA_CONFIG.url}/functions/v1/livekit-token`;

  async function getSDK() {
    if (sdk) return sdk;
    try {
      sdk = await import("https://cdn.jsdelivr.net/npm/livekit-client@2.15.0/+esm");
      return sdk;
    } catch {
      throw new Error("Live audio SDK could not load. Check your connection, then try again.");
    }
  }

  async function getToken(roomName, role) {
    const { data } = await window.Sonora.supabase.auth.getSession();
    const accessToken = data?.session?.access_token;
    if (!accessToken) throw new Error("Please sign in before joining live audio.");
    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ room: roomName, role })
    });
    if (!response.ok) {
      let detail = "";
      try { detail = (await response.json()).error || ""; } catch {}
      throw new Error(response.status === 404
        ? "The live audio token function is not deployed yet."
        : detail || `Live audio could not start (${response.status}).`);
    }
    return response.json();
  }

  return {
    async join(roomName, role = "listener") {
      const livekit = await getSDK();
      const credentials = await getToken(roomName, role);
      room?.disconnect();
      room = new livekit.Room({ adaptiveStream: true, dynacast: true });
      if (role === "listener") {
        room.on(livekit.RoomEvent.TrackSubscribed, (track) => {
          if (track.kind !== "audio" && track.kind !== livekit.Track?.Kind?.Audio) return;
          const element = track.attach();
          element.autoplay = true;
          element.setAttribute("playsinline", "");
          element.setAttribute("aria-hidden", "true");
          element.style.display = "none";
          document.body.appendChild(element);
          remoteAudioElements.add(element);
          element.play?.().catch(() => {
            window.dispatchEvent(new CustomEvent("sonora:audio-blocked"));
          });
        });
        room.on(livekit.RoomEvent.TrackUnsubscribed, (track) => {
          track.detach().forEach((element) => {
            remoteAudioElements.delete(element);
            element.remove();
          });
        });
      }
      await room.connect(credentials.url, credentials.token);
      if (role === "listener") {
        try { await room.startAudio(); } catch {}
      }
      return room;
    },
    async startAudio() {
      if (!room?.startAudio) return;
      await room.startAudio();
      remoteAudioElements.forEach((element) => element.play?.().catch(() => {}));
    },
    async publishMicrophone() {
      if (!room) throw new Error("Join the live room before publishing audio.");
      await room.localParticipant.setMicrophoneEnabled(true);
      return room;
    },
    async leave() {
      room?.disconnect();
      room = null;
      remoteAudioElements.forEach((element) => element.remove());
      remoteAudioElements.clear();
    },
    get room() { return room; }
  };
})();