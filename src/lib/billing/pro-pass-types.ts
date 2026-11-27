export const PRO_PASS_MONTHS = 12;
export const PRO_PASS_BATCH_MAX = 100;

export type ProPassStatus = "available" | "redeemed" | "expired" | "inactive";

export type ProPassRow = {
  id: string;
  code: string;
  months: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
  status: ProPassStatus;
  redeemed_at: string | null;
  redeemed_by_name: string | null;
  redeemed_by_email: string | null;
};

export function proPassStatus(input: {
  active: boolean;
  expires_at: string | null;
  redeemed: boolean;
  now?: number;
}): ProPassStatus {
  if (input.redeemed) return "redeemed";
  if (!input.active) return "inactive";
  if (input.expires_at && new Date(input.expires_at).getTime() <= (input.now ?? Date.now())) {
    return "expired";
  }
  return "available";
}
