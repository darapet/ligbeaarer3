# Sonora live audio setup

The frontend is already wired to call:

```text
https://jzrcxjjcsohyxqzebgda.supabase.co/functions/v1/livekit-token
```

The LiveKit API secret must stay inside Supabase. Never put it in `config.js`, `index.html`, or any GitHub file.

## 1. Add Supabase Edge Function secrets

In Supabase Dashboard:

1. Open the Sonora project.
2. Open **Edge Functions → Secrets**.
3. Add these three secrets using the values from the rotated LiveKit project:

```text
LIVEKIT_URL
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
```

Do not add the LiveKit secret to GitHub Pages or browser JavaScript.

## 2. Deploy the function

The function source is at:

```text
supabase/functions/livekit-token/index.ts
```

Using the Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref jzrcxjjcsohyxqzebgda
npx supabase functions deploy livekit-token
```

The final endpoint should be:

```text
https://jzrcxjjcsohyxqzebgda.supabase.co/functions/v1/livekit-token
```

## 3. Function source

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AccessToken } from "npm:livekit-server-sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) throw new Error("Authentication required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error("Please sign in before joining live audio.");
    }

    const { room, role = "listener" } = await request.json();

    if (!room || !/^[a-zA-Z0-9_-]{2,80}$/.test(room)) {
      throw new Error("Invalid room name");
    }

    const token = new AccessToken(
      Deno.env.get("LIVEKIT_API_KEY")!,
      Deno.env.get("LIVEKIT_API_SECRET")!,
      {
        identity: user.id,
        name: user.email ?? user.id,
      },
    );

    token.addGrant({
      roomJoin: true,
      room,
      canPublish: role === "broadcaster",
      canSubscribe: true,
    });

    return new Response(
      JSON.stringify({
        token: await token.toJwt(),
        url: Deno.env.get("LIVEKIT_URL"),
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error
          ? error.message
          : "Token request failed",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
```

## 4. Test the full flow

1. Open the GitHub Pages site over HTTPS.
2. Create or sign in to a broadcaster account.
3. Click **Broadcast your church**.
4. Allow microphone permission.
5. Complete the sound test.
6. Click **Go live**.
7. Open the site in a second browser or private window.
8. Sign in as a listener.
9. Open **Listen live**.
10. Click the live broadcast card.
11. Confirm the listener can hear the broadcaster.
12. End the broadcast from the broadcaster window.

If the frontend reports `The live audio token function is not deployed yet`, deploy the Edge Function or check that the function name is exactly `livekit-token`.