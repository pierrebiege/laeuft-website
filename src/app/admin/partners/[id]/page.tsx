"use client";

import { use } from "react";
import { PartnerDetail } from "@/components/PartnerDetail";

export default function PartnerDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(paramsPromise);

  return <PartnerDetail id={id} />;
}
