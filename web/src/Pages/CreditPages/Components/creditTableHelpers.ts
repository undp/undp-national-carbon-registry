import { CreditBlockStatus } from "../Enums/creditEventEnum";

export type SortOrder = "ASC" | "DESC";

export const toSortOrder = (antdOrder?: string | null): SortOrder | undefined =>
  antdOrder === "ascend" ? "ASC" : antdOrder === "descend" ? "DESC" : undefined;

export const compareStrings = (a?: string | null, b?: string | null) =>
  (a ?? "").localeCompare(b ?? "");

export const compareNumbers = (a?: number | null, b?: number | null) =>
  (a ?? 0) - (b ?? 0);

export const getCreditBlockStatusTagColor = (status: CreditBlockStatus) => {
  switch (status) {
    case CreditBlockStatus.RETIRED:
      return "warning";
    case CreditBlockStatus.ASSIGNED:
      return "success";
    default:
      return "default";
  }
};

// MO/ITMO classifier pill color — kept separate from status colors
// ("purple" is already used for retirement/authorization "Pending"
// status in the same rows).
export const getCreditTypeTagColor = (isItmo: boolean) =>
  isItmo ? "gold" : "default";
