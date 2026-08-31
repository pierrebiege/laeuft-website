import type { Metadata } from "next";
import PostForm from "@/app/backyard/_components/PostForm";

export const metadata: Metadata = {
  title: "Post to the feed",
  description: "Write into the live feed of Team Switzerland at the Backyard Ultra World Team Championship.",
  robots: { index: false, follow: false },
};

export default function PostPage() {
  return (
    <section data-hour="tag" data-stamp="Post" className="px-5 pb-24 pt-28">
      <div className="mx-auto max-w-[36rem]">
        <p className="stamp mb-6">Live feed</p>
        <h1 className="display text-[2rem] sm:text-4xl">Say something.</h1>
        <p className="mt-6 text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
          Whatever is happening in the tent, on the loop, at the bell. Keep it short —
          it goes straight onto the live page, next to the loop count. Jokes welcome,
          nothing at anyone&rsquo;s expense.
        </p>
        <PostForm />
      </div>
    </section>
  );
}
