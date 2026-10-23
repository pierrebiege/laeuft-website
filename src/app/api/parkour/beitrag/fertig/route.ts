import { NextRequest, NextResponse, after } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { BUCKET, TABELLE, melden, sauber, type Beitrag, type DateiEintrag } from "@/lib/parkourDoku";

/* Der Browser meldet, dass die Uploads eines Beitrags durch sind.
   Ob eine Datei wirklich angekommen ist, prüfen wir selbst im Bucket —
   die Liste des Browsers dient nur als Hinweis. Danach Mail an Pierre. */

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let k: Record<string, unknown>;
  try {
    k = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const id = sauber(k.id, 40);
  const schluessel = sauber(k.schluessel, 100);
  if (!/^[0-9a-f-]{36}$/.test(id) || !schluessel) return NextResponse.json({ ok: false }, { status: 400 });

  const { data: zeile, error } = await supabaseAdmin.from(TABELLE).select("*").eq("id", id).maybeSingle();
  if (error || !zeile || !zeile.schluessel_hash) return NextResponse.json({ ok: false }, { status: 404 });

  const soll = Buffer.from(zeile.schluessel_hash, "hex");
  const ist = createHash("sha256").update(schluessel).digest();
  if (soll.length !== ist.length || !timingSafeEqual(soll, ist)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  if (zeile.status !== "hochladen") return NextResponse.json({ ok: true });

  const { data: liste } = await supabaseAdmin.storage.from(BUCKET).list(id, { limit: 100 });
  const vorhanden = new Map((liste ?? []).map((o) => [`${id}/${o.name}`, o]));

  const dateien: DateiEintrag[] = (zeile.dateien as DateiEintrag[]).map((d) => ({
    ...d,
    angekommen: vorhanden.has(d.pfad),
  }));
  const alle = dateien.every((d) => d.angekommen);

  const { error: updFehler } = await supabaseAdmin
    .from(TABELLE)
    .update({ dateien, status: alle ? "eingegangen" : "unvollstaendig", schluessel_hash: null })
    .eq("id", id);
  if (updFehler) console.error("[parkour/fertig] Supabase:", updFehler);

  after(async () => {
    try {
      await melden({ ...(zeile as Beitrag), dateien });
    } catch (e) {
      console.error("[parkour/fertig] Mail:", e);
    }
  });

  return NextResponse.json({ ok: true, alle });
}
