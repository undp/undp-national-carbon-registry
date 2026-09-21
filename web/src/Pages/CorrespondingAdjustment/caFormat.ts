// Shared number formatting for the Corresponding Adjustment pages.
// Previously each page carried its own `fmt` with a different fallback
// ("0.00" on the list, "N/A" on the detail page), so the same missing
// value rendered differently depending on where you looked.

const EM_DASH = "—";

// Whole-number quantities with thousands separators — the period
// table's cells and the list page's ITMO columns.
export const fmtQty = (val: number | string | null | undefined): string =>
  val === null || val === undefined || val === ""
    ? EM_DASH
    : Number(val).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });

// Two decimal places, for figures where the fraction matters (an
// Averaging adjustment is rarely a whole number).
export const fmtDecimal = (val: number | string | null | undefined): string =>
  val === null || val === undefined || val === ""
    ? EM_DASH
    : Number(val).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
