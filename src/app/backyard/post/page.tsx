import type { Metadata } from "next";
import PostForm from "@/app/backyard/_components/PostForm";

export const metadata: Metadata = {
  title: "Send them a message",
  description: "Write to the fifteen runners of Team Switzerland during the Backyard Ultra World Team Championship. Your message goes onto the live page and gets read out at the tent.",
};

export default function PostPage() {
  return (
    <section data-hour="tag" data-stamp="Post" className="px-5 pb-24 pt-28">
      <div className="mx-auto max-w-[36rem]">
        <p className="stamp mb-6">Live feed</p>
        <h1 className="display text-[2rem] sm:text-4xl">Say something to them.</h1>
        <p className="mt-6 text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
          Fifteen people are going round the same loop for as long as they can. Your
          message lands on the live page and gets read out at the tent, which at four
          in the morning is worth more than you think.
        </p>
        <p className="mt-4 text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
          Keep it short. Jokes welcome — nothing at anyone&rsquo;s expense.
        </p>
        <PostForm />
      </div>
    </section>
  );
}
