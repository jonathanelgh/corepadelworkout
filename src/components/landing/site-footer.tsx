import Link from "next/link";
import { BrandWordmark } from "@/components/brand/brand-wordmark";

const LEGAL_EMAIL = "hello@corepadel.app";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-black text-white">
      <div className="mx-auto max-w-[1400px] px-6 py-14 md:px-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex">
              <BrandWordmark tone="onDark" />
            </Link>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-400">
              Video-guided strength and conditioning for padel players.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Explore</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/programs" className="text-gray-300 transition hover:text-[#ccff00]">
                  Programs
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-gray-300 transition hover:text-[#ccff00]">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-300 transition hover:text-[#ccff00]">
                  Log in
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Legal</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/terms" className="text-gray-300 transition hover:text-[#ccff00]">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 transition hover:text-[#ccff00]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${LEGAL_EMAIL}`}
                  className="text-gray-300 transition hover:text-[#ccff00]"
                >
                  {LEGAL_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-8 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
          <p>&copy; {year} CorePadel. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
