import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { BUCKET } from "@/lib/parkourDoku";

/* Download einer eingesandten Datei aus dem privaten Bucket.
   Nur mit Admin-Session; leitet auf eine signierte URL weiter, die eine
   Stunde gilt. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const nichtErlaubt = await requireAuth(request);
  if (nichtErlaubt) return nichtErlaubt;

  const pfad = request.nextUrl.searchParams.get("pfad") || "";
  const name = request.nextUrl.searchParams.get("name") || undefined;
  const ansehen = request.nextUrl.searchParams.get("ansehen") === "1";
  if (!/^[0-9a-f-]{36}\/[A-Za-z0-9._-]+$/.test(pfad)) {
    return NextResponse.json({ error: "Ungültiger Pfad." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(pfad, 60 * 60, ansehen ? undefined : { download: name || true });
  if (error || !data) {
    return NextResponse.json({ error: "Datei nicht gefunden." }, { status: 404 });
  }
  return NextResponse.redirect(data.signedUrl, 302);
}
