import type { ReactNode } from "react";
import type { Hour } from "./useSectionTheme";

export default function PageHead({
  hour,
  stamp,
  title,
  lead,
}: {
  hour: Hour;
  stamp: string;
  title: ReactNode;
  lead?: ReactNode;
}) {
  return (
    <section data-hour={hour} data-stamp={stamp} className="px-5 pb-16 pt-28 sm:pb-20 sm:pt-32">
      <div className="mx-auto max-w-[76rem]">
        <div className="mb-10 border-b pb-4 rule">
          <span className="stamp">{stamp}</span>
        </div>
        <h1 className="display max-w-3xl text-[2.4rem] sm:text-6xl">{title}</h1>
        {lead && (
          <p className="mt-7 max-w-xl text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
            {lead}
          </p>
        )}
      </div>
    </section>
  );
}
