/// <reference lib="deno.ns" />
// Follow this setup guide to integrate the Deno language server with your editor:
// https://supabase.com/docs/guides/functions/local-development
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

console.log("Hello from notify-matched-donors!");

serve(async (req: Request) => {
  try {
    // Check if the request is valid JSON
    const payload = await req.json();

    // Webhook specifically tracking the 'requests' table an on 'INSERT'
    if (payload.type === "INSERT" && payload.table === "requests") {
      const newRequest = payload.record;

      const bloodTypeStr = newRequest.blood_type; // e.g. "O+"
      const areaStr = newRequest.area; // e.g. "Dhanmondi"
      const hospitalStr = newRequest.hospital_name; // e.g. "Square Hospital"

      if (!bloodTypeStr || !areaStr) {
        return new Response(
          JSON.stringify({
            error: "Missing required fields (blood_type, area)",
          }),
          { status: 400 },
        );
      }

      // Initialize Supabase Client
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      // Query profiles that match blood type AND have the area in preferred_areas
      // Also ensure they have an expo_push_token and are active
      const { data: matchedProfiles, error: profilesError } =
        await supabaseAdmin
          .from("profiles")
          .select("id, expo_push_token")
          .eq("blood_type", bloodTypeStr)
          .eq("is_donor_active", true)
          .contains("preferred_areas", [areaStr])
          .not("expo_push_token", "is", null);

      if (profilesError) {
        throw new Error(`Profile query error: ${profilesError.message}`);
      }

      if (!matchedProfiles || matchedProfiles.length === 0) {
        return new Response(
          JSON.stringify({ message: "No matched donors found." }),
          { status: 200 },
        );
      }

      // Filter out invalid tokens
      const expoPushTokens = matchedProfiles
        .map((p: any) => p.expo_push_token)
        .filter((t: any) => t && String(t).startsWith("ExponentPushToken["));

      if (expoPushTokens.length === 0) {
        return new Response(
          JSON.stringify({
            message: "No valid Expo push tokens found among matched donors.",
          }),
          { status: 200 },
        );
      }

      // Construct Expo Notification Payload
      const messageTitle = `Urgent Blood Request in ${areaStr}`;
      const messageBody = `Someone needs ${bloodTypeStr} blood at ${hospitalStr || "a nearby hospital"}. Can you help?`;

      const notifications = expoPushTokens.map((token: any) => ({
        to: token,
        sound: "default",
        title: messageTitle,
        body: messageBody,
        data: { requestId: newRequest.id },
      }));

      // Send Request to Expo Servers
      const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notifications),
      });

      const expoData = await expoRes.json();

      return new Response(
        JSON.stringify({
          message: `Notifications sent to ${expoPushTokens.length} donors.`,
          expoResponse: expoData,
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    return new Response(
      JSON.stringify({ message: "Ignoring non-insert request." }),
      { status: 200 },
    );
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
