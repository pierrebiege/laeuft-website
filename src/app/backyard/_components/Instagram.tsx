import { TEAM_INSTAGRAM } from "@/app/backyard/_data/people";

/** Verweis auf den Instagram-Kanal des Teams. Eine Zeile, eine Haarlinie. */
export default function Instagram({ className = "" }: { className?: string }) {
  return (
    <a
      href={`https://www.instagram.com/${TEAM_INSTAGRAM}/`}
      target="_blank"
      rel="noreferrer"
      className={`flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-y py-6 rule ${className}`}
    >
      <span className="text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
        Every runner introduced, and the race as it happens, on Instagram.
      </span>
      <span className="display text-2xl sm:text-3xl">@{TEAM_INSTAGRAM} ↗</span>
    </a>
  );
}
