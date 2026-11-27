import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { notifyAdminTrialStarted } from "@/lib/emails/notify-admin-trial-started";
import { sendProWelcomeEmailForCheckoutSession } from "@/lib/emails/send-pro-welcome-email";
import { getStripeWebhookSecret } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { lockAffiliateSubscription, recordAffiliateCommission } from "@/lib/affiliates/commissions";
import {
  syncStripeSubscription,
  syncStripeSubscriptionFromCheckoutSession,
} from "@/lib/stripe/sync-subscription";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, getStripeWebhookSecret());
  } catch (e) {
    console.error("[stripe/webhook] signature verification failed:", e);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription") {
          await syncStripeSubscriptionFromCheckoutSession(session);
          const userId = session.metadata?.user_id?.trim();
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id;
          if (userId && subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            await lockAffiliateSubscription(userId, subscription);
          }
          // Never fail the webhook if email delivery fails.
          await sendProWelcomeEmailForCheckoutSession(session);
          await notifyAdminTrialStarted(session);
        }
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await recordAffiliateCommission(invoice);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await syncStripeSubscription(sub);
        const userId = sub.metadata.user_id?.trim();
        if (userId && (sub.status === "trialing" || sub.status === "active")) {
          await lockAffiliateSubscription(userId, sub);
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error(`[stripe/webhook] handler error for ${event.type}:`, e);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
