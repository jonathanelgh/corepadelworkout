/**
 * One-off / manual: enroll eligible free users into the Pro conversion drip
 * (staggered for existing members). Does not send emails by itself.
 *
 * Usage: npx tsx --env-file=.env.local scripts/enroll-pro-conversion-nurture.ts
 */
import { enrollEligibleProConversionUsers } from "../src/lib/emails/pro-conversion-nurture";

async function main() {
  const result = await enrollEligibleProConversionUsers({ limit: 500 });
  console.log(JSON.stringify(result));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
