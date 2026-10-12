// Holt einmalig den Strava-Refresh-Token fürs Studio (swiss-backyardultra.ch/studio).
//
// Vorher auf https://www.strava.com/settings/api eine App anlegen:
//   Authorization Callback Domain: localhost
// Dann:
//   STRAVA_CLIENT_ID=… STRAVA_CLIENT_SECRET=… node scripts/strava-auth.mjs
// Der Browser öffnet sich, «Autorisieren» klicken. Das Skript gibt den
// Refresh-Token aus. Nicht in Dateien speichern: in `pw` und in Vercel.
import http from "node:http";
import { exec } from "node:child_process";

const { STRAVA_CLIENT_ID: id, STRAVA_CLIENT_SECRET: secret } = process.env;
if (!id || !secret) {
  console.error("STRAVA_CLIENT_ID und STRAVA_CLIENT_SECRET setzen.");
  process.exit(1);
}
const redirect = "http://localhost:8723/cb";
const url = `https://www.strava.com/oauth/authorize?client_id=${id}&response_type=code&redirect_uri=${encodeURIComponent(redirect)}&approval_prompt=force&scope=read,activity:read_all`;

http
  .createServer(async (req, res) => {
    const code = new URL(req.url, redirect).searchParams.get("code");
    if (!code) return res.end("Kein Code.");
    const r = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: id, client_secret: secret, code, grant_type: "authorization_code" }),
    });
    const j = await r.json();
    res.end(j.refresh_token ? "Verbunden. Fenster schliessen." : "Fehler, siehe Terminal.");
    if (!j.refresh_token) console.error(j);
    else console.log(`\nSTRAVA_REFRESH_TOKEN=${j.refresh_token}\nAthlet: ${j.athlete?.firstname} ${j.athlete?.lastname}\n`);
    process.exit(j.refresh_token ? 0 : 1);
  })
  .listen(8723, () => exec(`open "${url}"`));
