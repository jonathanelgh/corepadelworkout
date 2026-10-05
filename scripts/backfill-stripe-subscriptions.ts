/**
 * One-off: sync active Stripe subscriptions into customer_subscriptions.
 * Usage: npx tsx --env-file=.env.local scripts/backfill-stripe-subscriptions.ts
 */
import { getStripe } from "../src/lib/stripe/server";
import { syncStripeSubscription } from "../src/lib/stripe/sync-subscription";

async function main() {
  const stripe = getStripe();
  let synced = 0;
  let failed = 0;

  for await (const sub of stripe.subscriptions.list({
    status: "active",
    limit: 100,
  })) {
    try {
      await syncStripeSubscription(sub);
      synced += 1;
      console.log("synced", sub.id, sub.metadata.user_id);
    } catch (e) {
      failed += 1;
      console.error("failed", sub.id, e instanceof Error ? e.message : e);
    }
  }

  console.log(JSON.stringify({ synced, failed }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
