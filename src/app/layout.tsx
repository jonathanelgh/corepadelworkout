import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://corepadelworkout.com"),
  title: {
    default: "Core Padel Workout",
    template: "%s · Core Padel Workout",
  },
  description:
    "Padel-focused strength, conditioning, and rehab programs to help you move better, hit harder, and stay injury-free.",
  openGraph: {
    title: "Core Padel Workout",
    description:
      "Padel-focused strength, conditioning, and rehab programs to help you move better, hit harder, and stay injury-free.",
    url: "/",
    siteName: "Core Padel Workout",
    images: [
      {
        url: "/hero-bg.webp",
        width: 1200,
        height: 630,
        alt: "Core Padel Workout landing page",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Core Padel Workout",
    description:
      "Padel-focused strength, conditioning, and rehab programs to help you move better, hit harder, and stay injury-free.",
    images: ["/hero-bg.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
