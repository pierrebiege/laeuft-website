import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { PresentationView } from "@/components/presentations/PresentationBlocks";

export const dynamic = "force-dynamic";

export default async function CustomerPresentationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { slug } = await params;
  const { t } = await searchParams;

  const { data } = await supabaseAdmin
    .from("presentations")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!data) notFound();
  if (data.share_token !== t) notFound();

  // Track view (fire-and-forget)
  await supabaseAdmin
    .from("presentations")
    .update({
      view_count: (data.view_count || 0) + 1,
      last_viewed_at: new Date().toISOString(),
      status: data.status === "draft" ? "viewed" : data.status,
    })
    .eq("id", data.id);

  return <PresentationView data={data} />;
}
