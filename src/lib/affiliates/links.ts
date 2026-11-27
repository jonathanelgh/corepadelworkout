import { getPublicSiteUrl } from "@/lib/stripe/config";

export function affiliateLink(code: string): string {
  return `${getPublicSiteUrl()}/a/${code}`;
}
