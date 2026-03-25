import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Elbow Pain in Padel",
  description:
    "Elbow pain from padel? Follow a clear plan to calm symptoms, rebuild tendon capacity, and return to court with confidence.",
  openGraph: {
    title: "Elbow Pain in Padel",
    description:
      "Elbow pain from padel? Follow a clear plan to calm symptoms, rebuild tendon capacity, and return to court with confidence.",
    url: "/elbow-pain",
    siteName: "Core Padel Workout",
    images: [
      {
        url: "/elbopain-landing.webp",
        width: 1200,
        height: 630,
        alt: "Elbow pain landing page for Core Padel Workout",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Elbow Pain in Padel",
    description:
      "Elbow pain from padel? Follow a clear plan to calm symptoms, rebuild tendon capacity, and return to court with confidence.",
    images: ["/elbopain-landing.webp"],
  },
};

export default function ElbowPainLayout({ children }: { children: React.ReactNode }) {
  return children;
}
