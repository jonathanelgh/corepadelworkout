import Link from "next/link";

const LEGAL_EMAIL = "hello@corepadel.app";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-black text-white">
      <div className="mx-auto max-w-[1400px] px-6 py-14 md:px-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="text-lg font-bold tracking-wider uppercase">Core Padel Workout</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-400">
              Strength, conditioning, and rehab programs built for padel players. Train at the gym,
              at home, or on the court.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Explore</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/#programs" className="text-gray-300 transition hover:text-[#ccff00]">
                  Programs
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-gray-300 transition hover:text-[#ccff00]">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/programs" className="text-gray-300 transition hover:text-[#ccff00]">
                  Program library
                </Link>
              </li>
              <li>
                <Link href="/free-warmup" className="text-gray-300 transition hover:text-[#ccff00]">
                  Free warmup
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-300 transition hover:text-[#ccff00]">
                  Blog
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
          <p>&copy; {year} Core Padel Workout. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/login" className="transition hover:text-gray-300">
              Login
            </Link>
            <Link href="/signup" className="transition hover:text-gray-300">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
