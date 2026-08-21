window.SonoraLiveKit = (() => {
  let room;
  const tokenEndpoint = `${window.SONORA_CONFIG.url}/functions/v1/livekit-token`;

  async function getToken(roomName, role) {
    const { data } = await window.Sonora.supabase.auth.getSession();
    const accessToken = data?.session?.access_token;
    if (!accessToken) throw new Error("Please sign in before joining live audio.");
    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ room: roomName, role })
    });
    if (!response.ok) throw new Error(response.status === 404 ? "The live audio token function is not deployed yet." : `Live audio could not start (${response.status}).`);
    return response.json();
  }

  return {
    async join(roomName, role = "listener") {
      if (!window.LivekitClient) throw new Error("Live audio SDK is unavailable. Refresh and try again.");
      const credentials = await getToken(roomName, role);
      room = new window.LivekitClient.Room({ adaptiveStream: true, dynacast: true });
      await room.connect(credentials.url, credentials.token);
      return room;
    },
    async publishMicrophone() {
      if (!room) throw new Error("Join the live room before publishing audio.");
      await room.localParticipant.setMicrophoneEnabled(true);
      return room;
    },
    async leave() {
      room?.disconnect();
      room = null;
    },
    get room() { return room; }
  };
})();