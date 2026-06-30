import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/landing/legal-page-layout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Core Padel Workout collects, uses, and protects your personal data.",
};

const LAST_UPDATED = "23 May 2026";

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <p>
        This Privacy Policy explains how Core Padel Workout (&quot;we&quot;, &quot;us&quot;, or
        &quot;our&quot;) collects, uses, shares, and protects personal data when you use our
        website and training platform (the &quot;Service&quot;).
      </p>

      <h2>1. Data controller</h2>
      <p>
        Core Padel Workout is the data controller for personal data processed through the Service.
        Contact us at <a href="mailto:hello@corepadel.app">hello@corepadel.app</a> for privacy
        questions or requests.
      </p>

      <h2>2. Personal data we collect</h2>
      <p>Depending on how you use the Service, we may collect:</p>
      <ul>
        <li>
          <strong>Account data:</strong> name, email address, password hash, and profile details you
          provide during signup or onboarding.
        </li>
        <li>
          <strong>Training preferences:</strong> training environment, equipment, goals, and related
          onboarding answers used to personalise programs.
        </li>
        <li>
          <strong>Usage and progress data:</strong> programs started, sessions completed, workout
          start and completion times, and interactions with program content.
        </li>
        <li>
          <strong>Subscription and billing data:</strong> subscription status, plan details, and
          payment references processed through Stripe. We do not store full payment card numbers.
        </li>
        <li>
          <strong>Communications:</strong> messages you send us and emails we send you, such as
          account verification, password reset, and service updates.
        </li>
        <li>
          <strong>Technical data:</strong> IP address, browser type, device information, and cookies
          or similar technologies needed to operate and secure the Service.
        </li>
      </ul>

      <h2>3. How we use your data</h2>
      <p>We use personal data to:</p>
      <ul>
        <li>Create and manage your account.</li>
        <li>Provide access to programs, workouts, and member features.</li>
        <li>Track training progress and show your activity history.</li>
        <li>Process subscriptions and payments.</li>
        <li>Send service-related emails and respond to support requests.</li>
        <li>Improve the Service, fix bugs, and maintain security.</li>
        <li>Comply with legal obligations and enforce our Terms.</li>
      </ul>

      <h2>4. Legal bases for processing (EEA/UK users)</h2>
      <p>Where GDPR or similar laws apply, we rely on:</p>
      <ul>
        <li>
          <strong>Contract:</strong> to provide the Service you signed up for, including program
          access and billing.
        </li>
        <li>
          <strong>Legitimate interests:</strong> to secure the platform, prevent abuse, and improve
          our products, balanced against your rights.
        </li>
        <li>
          <strong>Consent:</strong> where required for optional marketing communications or
          non-essential cookies.
        </li>
        <li>
          <strong>Legal obligation:</strong> where we must retain or disclose data to comply with
          law.
        </li>
      </ul>

      <h2>5. How we share data</h2>
      <p>We do not sell your personal data. We may share data with trusted service providers who help us operate the Service, such as:</p>
      <ul>
        <li>
          <strong>Supabase</strong> for authentication, database hosting, and file storage.
        </li>
        <li>
          <strong>Stripe</strong> for subscription billing and payment processing.
        </li>
        <li>
          <strong>Email providers</strong> such as Resend for transactional email delivery.
        </li>
        <li>
          <strong>Infrastructure and analytics providers</strong> that help us host, monitor, and
          improve the Service.
        </li>
      </ul>
      <p>
        These providers process data on our instructions and under appropriate contractual
        safeguards. We may also disclose data if required by law, court order, or to protect our
        rights, users, or the public.
      </p>

      <h2>6. International transfers</h2>
      <p>
        Your data may be processed in countries outside your own, including within the European
        Economic Area and by providers in other regions. Where required, we use appropriate safeguards
        such as standard contractual clauses or equivalent mechanisms.
      </p>

      <h2>7. Cookies and similar technologies</h2>
      <p>
        We use essential cookies and local storage to keep you signed in, remember preferences, and
        protect the Service. We may also use analytics or performance tools to understand how the
        platform is used. You can control non-essential cookies through your browser settings, but
        some features may not work correctly if essential cookies are disabled.
      </p>

      <h2>8. Data retention</h2>
      <p>
        We keep personal data only as long as needed for the purposes described in this policy,
        including while your account is active and for a reasonable period afterward for backups,
        legal compliance, and dispute resolution. Training progress and subscription records may be
        retained according to operational and accounting requirements.
      </p>

      <h2>9. Your rights</h2>
      <p>Depending on your location, you may have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you.</li>
        <li>Request correction of inaccurate data.</li>
        <li>Request deletion of your data, subject to legal exceptions.</li>
        <li>Restrict or object to certain processing.</li>
        <li>Request data portability where applicable.</li>
        <li>Withdraw consent where processing is based on consent.</li>
        <li>Lodge a complaint with your local data protection authority.</li>
      </ul>
      <p>
        To exercise these rights, email{" "}
        <a href="mailto:hello@corepadel.app">hello@corepadel.app</a>. We may need to verify your
        identity before responding.
      </p>

      <h2>10. Children</h2>
      <p>
        The Service is not directed at children under 16, and we do not knowingly collect personal
        data from them. If you believe a child has provided us data, contact us and we will take
        appropriate steps to delete it.
      </p>

      <h2>11. Security</h2>
      <p>
        We use technical and organisational measures designed to protect personal data, including
        access controls, encrypted connections, and secure hosting. No online service can be
        guaranteed completely secure, so please use a strong password and keep your credentials
        private.
      </p>

      <h2>12. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will post the revised version on
        this page and update the &quot;Last updated&quot; date. Material changes may also be
        communicated by email or in-product notice where appropriate.
      </p>

      <h2>13. Contact</h2>
      <p>
        For privacy questions or requests, contact{" "}
        <a href="mailto:hello@corepadel.app">hello@corepadel.app</a>.
      </p>
    </LegalPageLayout>
  );
}
