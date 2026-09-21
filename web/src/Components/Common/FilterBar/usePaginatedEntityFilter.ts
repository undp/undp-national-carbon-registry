/* eslint-disable @typescript-eslint/no-explicit-any */
import { useConnection } from "../../../Context/ConnectionContext/connectionContext";
import { usePaginatedSelectOptions } from "./usePaginatedSelectOptions";
import type {
  FilterOption,
  FilterValue,
  MultiSelectFilterControl,
  SingleSelectFilterControl,
} from "./FilterBar";

/** One AND-composed backend filter condition — mirrors the server's generic
 * `{ key, operation, value }` filterAnd/filterOr entry shape. Any key/
 * operation/value is valid (e.g. `{ key: "creditIssued", operation: ">",
 * value: 0 }`); nothing here is specific to any one business rule. */
export interface FilterEntry {
  key: string;
  operation: string;
  value: unknown;
}

export interface UsePaginatedEntityFilterParams {
  /** Any POST list endpoint following the standard QueryDto request /
   * DataListResponseDto response shape - not specific to any one entity. */
  endpoint: string;
  /** FilterBar control id, e.g. "project" or "organization". */
  id: string;
  placeholder?: string;
  mode: "multiple" | "single";
  width?: number | string;
  /** Response field read as the option label (ignored if `mapRow` given). */
  labelKey?: string;
  /** Response field read as the option value (ignored if `mapRow` given). */
  valueKey?: string;
  /** Escape hatch replacing the default `row[labelKey]`/`row[valueKey]`
   * mapper - required if labelKey/valueKey aren't supplied. */
  mapRow?: (row: any) => FilterOption;
  /** Backend field the search box filters against (`like %term%`).
   * Defaults to `labelKey`. */
  searchKey?: string;
  sortKey?: string;
  sortOrder?: "ASC" | "DESC";
  /** Extra AND-composed conditions always sent alongside the live search
   * term - the caller's own scoping/business rule, e.g. `[{ key:
   * "creditIssued", operation: ">", value: 0 }]`. Static for the
   * component's lifetime: changing this value across renders does not
   * itself trigger a re-fetch of already-loaded pages (the same way a
   * changed `fetchPage` closure wouldn't have before this hook existed). */
  extraFilters?: FilterEntry[];
  selectedValues: FilterValue[];
  pageSize?: number;
  minFill?: number;
}

export interface PaginatedEntityFilter {
  /** Ready to place directly in FilterBar's `controls` array. */
  control: MultiSelectFilterControl | SingleSelectFilterControl;
  options: FilterOption[];
  loading: boolean;
}

/**
 * Drives a server-searched, infinite-scroll-paginated FilterBar select
 * against any list endpoint, and hands back a ready-to-use control object
 * instead of just the raw paginated-options state - eliminating the
 * fetchPage-closure + control-object boilerplate every such filter used to
 * duplicate. All entity-specific behavior (which endpoint, which fields,
 * which extra scoping conditions) is supplied by the caller; the actual
 * pagination/search/scroll/sticky-cache mechanics live in
 * usePaginatedSelectOptions, which this hook composes rather than
 * reimplements.
 */
export const usePaginatedEntityFilter = ({
  endpoint,
  id,
  placeholder,
  mode,
  width = 220,
  labelKey,
  valueKey,
  mapRow,
  searchKey,
  sortKey,
  sortOrder = "ASC",
  extraFilters,
  selectedValues,
  pageSize,
  minFill,
}: UsePaginatedEntityFilterParams): PaginatedEntityFilter => {
  const { post } = useConnection();
  const effectiveSearchKey = searchKey ?? labelKey;

  const select = usePaginatedSelectOptions({
    selectedValues,
    pageSize,
    minFill,
    fetchPage: async ({ search, page, size }) => {
      const filterAnd: FilterEntry[] = [...(extraFilters ?? [])];
      if (search && effectiveSearchKey) {
        filterAnd.push({ key: effectiveSearchKey, operation: "like", value: `%${search}%` });
      }
      const response: any = await post(endpoint, {
        page,
        size,
        filterAnd: filterAnd.length > 0 ? filterAnd : undefined,
        sort: sortKey ? { key: sortKey, order: sortOrder } : undefined,
      });
      const rows: any[] = response?.data ?? [];
      return rows.map(
        (row): FilterOption =>
          mapRow ? mapRow(row) : { label: row[labelKey as string], value: row[valueKey as string] }
      );
    },
  });

  const base = {
    id,
    type: "select" as const,
    placeholder,
    options: select.options,
    width,
    serverSearch: true,
    loading: select.loading,
    onSearch: select.onSearch,
    onPopupScroll: select.onPopupScroll,
    onDropdownVisibleChange: (open: boolean) => open && select.onDropdownOpen(),
  };
  const control: MultiSelectFilterControl | SingleSelectFilterControl =
    mode === "multiple"
      ? { ...base, mode: "multiple", onSelectAll: select.loadAllOptions }
      : { ...base, mode: "single" };

  return { control, options: select.options, loading: select.loading };
};
