export function BothSidesCheckboxField({
  defaultChecked = false,
  disabled = false,
}: {
  defaultChecked?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3">
      <input
        type="checkbox"
        name="both_sides"
        value="on"
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-gray-900">Do on both sides</span>
        <span className="mt-0.5 block text-xs text-gray-500">
          For unilateral exercises (e.g. one leg at a time). Members see a reminder during the workout.
        </span>
      </span>
    </label>
  );
}
