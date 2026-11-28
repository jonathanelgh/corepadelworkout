export function PromoDiscountBannerView({ promoCode }: { promoCode: string }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      Enter <strong className="font-semibold">{promoCode}</strong> on the checkout page to apply it.
    </div>
  );
}
