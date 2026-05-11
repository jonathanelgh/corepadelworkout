import type { Metadata } from "next";
import { JoinWelcomeClient } from "./join-welcome-client";
import { resolvePreLaunchEbookPublicUrl } from "@/lib/emails/send-pre-launch-welcome";

export const metadata: Metadata = {
  title: "You are in",
  description: "Thank you for joining Core Padel Workout. Your e-book and launch perks are on the way.",
  robots: { index: false, follow: false },
};

type Search = Promise<{ existing?: string }> | undefined;

export default async function JoinWelcomePage({ searchParams }: { searchParams?: Search }) {
  const sp = (await searchParams) ?? {};
  const isExisting = sp.existing === "1";
  const ebookDownloadUrl = resolvePreLaunchEbookPublicUrl();

  return <JoinWelcomeClient isExisting={isExisting} ebookDownloadUrl={ebookDownloadUrl} />;
}
