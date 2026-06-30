import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/landing/legal-page-layout";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for using Core Padel Workout.",
};

const LAST_UPDATED = "23 May 2026";

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms & Conditions" lastUpdated={LAST_UPDATED}>
      <p>
        These Terms &amp; Conditions (&quot;Terms&quot;) govern your access to and use of the Core
        Padel Workout website, applications, and training services (collectively, the
        &quot;Service&quot;). By creating an account, purchasing a subscription, or using the
        Service, you agree to these Terms.
      </p>

      <h2>1. Who we are</h2>
      <p>
        The Service is operated by Core Padel Workout (&quot;we&quot;, &quot;us&quot;, or
        &quot;our&quot;). For questions about these Terms, contact us at{" "}
        <a href="mailto:hello@corepadel.app">hello@corepadel.app</a>.
      </p>

      <h2>2. Eligibility and accounts</h2>
      <p>
        You must be at least 16 years old to use the Service. You are responsible for keeping your
        login credentials secure and for all activity under your account. You agree to provide
        accurate information when registering and to update it when it changes.
      </p>
      <p>
        We may suspend or terminate accounts that violate these Terms, misuse the Service, or create
        risk for other users or for us.
      </p>

      <h2>3. Health, fitness, and medical disclaimer</h2>
      <p>
        Core Padel Workout provides educational fitness and conditioning content. It is not medical
        advice, physiotherapy, or a substitute for professional healthcare. You should consult a
        qualified healthcare provider before starting any exercise program, especially if you are
        pregnant, injured, or have a medical condition.
      </p>
      <p>
        You participate in workouts at your own risk. Stop exercising immediately if you feel pain,
        dizziness, shortness of breath, or any unusual symptoms. We are not responsible for injuries
        or health outcomes resulting from your use of the Service.
      </p>

      <h2>4. Programs, content, and changes</h2>
      <p>
        We provide structured training programs, workouts, videos, and related materials. Program
        availability, length, difficulty, and content may change over time. We may add, remove, or
        update programs without prior notice.
      </p>
      <p>
        Free programs and paid Pro content may have different access rules. Access to a program does
        not guarantee specific performance, fitness, or competitive results.
      </p>

      <h2>5. Subscriptions and payments</h2>
      <p>
        Some features require a paid Pro subscription. Prices, billing intervals, and included
        benefits are shown at checkout. Payments are processed by Stripe or another payment provider
        we designate. By subscribing, you authorize recurring charges until you cancel.
      </p>
      <ul>
        <li>Subscriptions renew automatically unless cancelled before the renewal date.</li>
        <li>
          You can manage or cancel your subscription through your account billing settings or the
          Stripe customer portal where available.
        </li>
        <li>
          Except where required by applicable law, fees are non-refundable once a billing period has
          started.
        </li>
        <li>We may change pricing for future billing periods with reasonable notice.</li>
      </ul>

      <h2>6. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Copy, scrape, redistribute, or resell Service content without permission.</li>
        <li>Reverse engineer, interfere with, or attempt to bypass access controls.</li>
        <li>Use the Service unlawfully or in a way that harms others or our systems.</li>
        <li>Impersonate another person or misrepresent your affiliation.</li>
      </ul>

      <h2>7. Intellectual property</h2>
      <p>
        The Service, including text, videos, graphics, branding, software, and program structures,
        is owned by us or our licensors and protected by intellectual property laws. We grant you a
        limited, personal, non-transferable, non-exclusive licence to access and use the Service for
        your own training while your account and entitlements remain active.
      </p>

      <h2>8. Third-party services</h2>
      <p>
        The Service may integrate with third-party providers such as payment processors, hosting
        providers, analytics tools, and email services. Your use of those services may be subject to
        their own terms and privacy policies.
      </p>

      <h2>9. Availability and disclaimers</h2>
      <p>
        We aim to keep the Service available, but we do not guarantee uninterrupted or error-free
        operation. The Service is provided on an &quot;as is&quot; and &quot;as available&quot;
        basis to the fullest extent permitted by law.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, we are not liable for indirect, incidental, special,
        consequential, or punitive damages, or for loss of profits, data, goodwill, or business
        opportunities arising from your use of the Service.
      </p>
      <p>
        Our total liability for any claim relating to the Service is limited to the greater of (a)
        the amount you paid us in the twelve months before the claim or (b) EUR 50, except where
        liability cannot be limited under applicable law.
      </p>

      <h2>11. Termination</h2>
      <p>
        You may stop using the Service at any time. You may cancel an active program or subscription
        through your account where those options are available. We may suspend or terminate access if
        you breach these Terms or if we discontinue the Service.
      </p>
      <p>
        Sections that by nature should survive termination, including intellectual property,
        disclaimers, and limitation of liability, will continue to apply.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These Terms are governed by the laws of Sweden, without regard to conflict-of-law principles.
        Disputes shall be subject to the exclusive jurisdiction of the courts of Sweden, unless
        mandatory consumer protection laws in your country require otherwise.
      </p>

      <h2>13. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. We will post the revised version on this page
        and update the &quot;Last updated&quot; date. Continued use of the Service after changes
        become effective constitutes acceptance of the updated Terms.
      </p>

      <h2>14. Contact</h2>
      <p>
        Questions about these Terms can be sent to{" "}
        <a href="mailto:hello@corepadel.app">hello@corepadel.app</a>.
      </p>
    </LegalPageLayout>
  );
}
