import { Button, Checkbox, DatePicker, Empty, Input, Modal, Popover, Radio, Select, Skeleton, Spin, Tag } from "antd";
import { DoubleRightOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import moment from "moment";
import "./FilterBar.scss";

const { Search } = Input;

export type FilterValue = string | number;
export type FilterControlValue = FilterValue | FilterValue[] | undefined;
export type FilterValues = Record<string, FilterControlValue>;

export interface FilterInfoLearnMore {
  title: ReactNode;
  content: ReactNode;
  label?: ReactNode;
  width?: number | string;
}

export interface FilterOption {
  label: ReactNode;
  value: FilterValue;
  disabled?: boolean;
  color?: string;
}

interface ControlBase {
  id: string;
  label?: ReactNode;
  placeholder?: string;
  visible?: boolean;
  disabled?: boolean;
  width?: number | string;
  showAsApplied?: boolean;
  isApplied?: (value: string | FilterValue | FilterValue[]) => boolean;
}

export interface SearchFilterControl extends ControlBase {
  type: "search";
  clearValue?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  infoVisible?: boolean;
  infoDescription?: ReactNode;
  infoLearnMore?: FilterInfoLearnMore;
}

/** Opt-in async behavior for a select control — the dropdown then loads its
 * options from the backend page-by-page and searches server-side (see
 * `usePaginatedSelectOptions`), instead of client-filtering a static list.
 * When `serverSearch` is set, antd's own option filtering is disabled so it
 * doesn't re-filter the server results. All optional — omit for the plain
 * static/client-search select. */
interface AsyncSelectControlProps {
  serverSearch?: boolean;
  loading?: boolean;
  onSearch?: (value: string) => void;
  onPopupScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  onDropdownVisibleChange?: (open: boolean) => void;
  /** Popup max height in px (antd default 256). Lower it so the list
   * overflows — and thus becomes scrollable, firing `onPopupScroll` — with
   * fewer options. */
  listHeight?: number;
}

export interface SingleSelectFilterControl extends ControlBase, AsyncSelectControlProps {
  type: "select";
  mode?: "single";
  clearValue?: FilterValue;
  options: FilterOption[];
  onChange?: (value: FilterValue | undefined) => void;
}

export interface MultiSelectFilterControl extends ControlBase, AsyncSelectControlProps {
  type: "select";
  mode: "multiple";
  clearValue?: FilterValue[];
  options: FilterOption[];
  onChange?: (value: FilterValue[]) => void;
  onSelectAll?: () => Promise<FilterOption[]>;
}

/** A single year picker (e.g. credit vintage) — stores the picked year as a
 * plain number in `values`, same as a select control's value. */
export interface YearFilterControl extends ControlBase {
  type: "year";
  clearValue?: FilterValue;
  onChange?: (value: FilterValue | undefined) => void;
}

export type FilterControl =
  | SearchFilterControl
  | SingleSelectFilterControl
  | MultiSelectFilterControl
  | YearFilterControl;

type ResolvedFilterControl =
  | (SearchFilterControl & { value: string })
  | (SingleSelectFilterControl & { value?: FilterValue })
  | (MultiSelectFilterControl & { value: FilterValue[] })
  | (YearFilterControl & { value?: FilterValue });

export interface RadioFilterGroup {
  id: string;
  label?: ReactNode;
  options: FilterOption[];
  onChange?: (value: FilterValue | FilterValue[]) => void;
  clearValue: FilterValue | FilterValue[];
  multiple?: boolean;
  selectAllValue?: FilterValue;
  overflowPlaceholder?: ReactNode;
  getAppliedValues?: (value: FilterValue[]) => FilterValue[];
  onRemoveAppliedValue?: (value: FilterValue) => void;
  visible?: boolean;
  disabled?: boolean;
  showAsApplied?: boolean;
  isApplied?: (value: FilterValue | FilterValue[]) => boolean;
}

export interface FilterBarProps {
  radioGroup?: RadioFilterGroup;
  controls?: FilterControl[];
  values: FilterValues;
  appliedValues?: FilterValues;
  onChange: (id: string, value: FilterControlValue) => void;
  loading?: boolean;
  disabled?: boolean;
  emptyText?: ReactNode;
  theme?: "light" | "dark";
  appliedFiltersLabel: ReactNode;
  clearAllLabel: ReactNode;
  onClearAll: () => void;
  selectAllLabel?: ReactNode;
  showAppliedFilters?: boolean;
  className?: string;
}

interface AppliedChip {
  key: string;
  label: ReactNode;
  remove: () => void;
}

const optionLabel = (options: FilterOption[], value: FilterValue) =>
  options.find((option) => option.value === value)?.label ?? String(value);

export const FilterBar = ({
  radioGroup,
  controls = [],
  values,
  appliedValues = {},
  onChange,
  loading = false,
  disabled = false,
  emptyText = "No filters available",
  theme = "light",
  appliedFiltersLabel,
  clearAllLabel,
  onClearAll,
  selectAllLabel = "Select All",
  showAppliedFilters = true,
  className = "",
}: FilterBarProps) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const radioMeasureRef = useRef<HTMLDivElement>(null);
  const [visibleRadioCount, setVisibleRadioCount] = useState<number>(Number.MAX_SAFE_INTEGER);
  const [overflowExpanded, setOverflowExpanded] = useState(false);
  const [openInfoPopoverId, setOpenInfoPopoverId] = useState<string>();
  const [openInfoDetails, setOpenInfoDetails] = useState<FilterInfoLearnMore>();
  const [selectAllLoadingId, setSelectAllLoadingId] = useState<string>();
  const visibleRadioConfig = radioGroup?.visible !== false ? radioGroup : undefined;
  const visibleRadio = visibleRadioConfig
    ? { ...visibleRadioConfig, value: values[visibleRadioConfig.id] ?? visibleRadioConfig.clearValue }
    : undefined;
  const visibleControls = controls
    .filter((control) => control.visible !== false)
    .map((control): ResolvedFilterControl => {
      const value = values[control.id];
      if (control.type === "search") {
        return { ...control, value: String(value ?? "") };
      }
      if (control.type === "year") {
        return { ...control, value: Array.isArray(value) ? undefined : value };
      }
      if (control.mode === "multiple") {
        return { ...control, value: Array.isArray(value) ? value : [] };
      }
      return { ...control, value: Array.isArray(value) ? undefined : value };
    });
  const chips: AppliedChip[] = [];
  const emitChange = (
    id: string,
    value: FilterControlValue,
    controlHandler?: (value: never) => void
  ) => {
    if (controlHandler) controlHandler(value as never);
    else onChange(id, value);
  };
  const changeRadio = (value: FilterValue | FilterValue[]) =>
    emitChange(visibleRadio?.id ?? "", value, visibleRadio?.onChange as ((value: never) => void) | undefined);
  const isAllSelected = (control: MultiSelectFilterControl & { value: FilterValue[] }) =>
    control.value.length > 0
    && control.options.length > 0
    && control.options.every((option) => control.value.includes(option.value));
  const toggleSelectAll = async (
    control: MultiSelectFilterControl & { value: FilterValue[] }
  ) => {
    const onControlChange = control.onChange as ((value: never) => void) | undefined;
    if (isAllSelected(control)) {
      emitChange(control.id, control.clearValue ?? [], onControlChange);
      return;
    }
    setSelectAllLoadingId(control.id);
    try {
      const options = (await control.onSelectAll?.()) ?? control.options;
      emitChange(control.id, options.map((option) => option.value), onControlChange);
    } finally {
      setSelectAllLoadingId(undefined);
    }
  };

  if (
    visibleRadio &&
    visibleRadio.showAsApplied !== false &&
    (visibleRadio.isApplied?.(visibleRadio.value) ?? true)
  ) {
    if (Array.isArray(visibleRadio.value)) {
      const selectedValues = visibleRadio.value;
      const appliedValues = visibleRadio.getAppliedValues?.(selectedValues)
        ?? (visibleRadio.selectAllValue !== undefined &&
          selectedValues.includes(visibleRadio.selectAllValue)
          ? [visibleRadio.selectAllValue]
          : selectedValues);
      appliedValues.forEach((value) => chips.push({
        key: `group-${visibleRadio.id}-${value}`,
        label: optionLabel(visibleRadio.options, value),
        remove: () => visibleRadio.onRemoveAppliedValue
          ? visibleRadio.onRemoveAppliedValue(value)
          : visibleRadio.selectAllValue === value
            ? changeRadio(visibleRadio.clearValue)
          : changeRadio(
              selectedValues.filter((selectedValue) => selectedValue !== value)
            ),
      }));
    } else {
      chips.push({
        key: `radio-${visibleRadio.id}-${visibleRadio.value}`,
        label: optionLabel(visibleRadio.options, visibleRadio.value),
        remove: () => changeRadio(visibleRadio.clearValue),
      });
    }
  }

  visibleControls.forEach((control) => {
    if (control.showAsApplied === false) return;
    const chipValue = appliedValues[control.id] ?? control.value;
    const applied = control.isApplied?.(chipValue) ??
      (Array.isArray(chipValue) ? chipValue.length > 0 : String(chipValue ?? "").trim() !== "");
    if (!applied) return;

    if (control.type === "search") {
      chips.push({
        key: `${control.id}-${chipValue}`,
        label: control.label ? <>{control.label}: {chipValue}</> : chipValue,
        remove: () => {
          const clearValue = control.clearValue ?? "";
          emitChange(control.id, clearValue, control.onChange as ((value: never) => void) | undefined);
          control.onSearch?.(clearValue);
        },
      });
    } else if (control.type === "year") {
      if (control.value !== undefined) {
        chips.push({
          key: `${control.id}-${control.value}`,
          label: control.label ? <>{control.label}: {control.value}</> : <>{control.value}</>,
          remove: () => emitChange(
            control.id,
            control.clearValue,
            control.onChange as ((value: never) => void) | undefined
          ),
        });
      }
    } else if (control.mode === "multiple") {
      (control.value as FilterValue[]).forEach((value) => chips.push({
        key: `${control.id}-${value}`,
        label: control.label ? <>{control.label}: {optionLabel(control.options, value)}</> : optionLabel(control.options, value),
        remove: () => emitChange(
          control.id,
          (control.value as FilterValue[]).filter((item) => item !== value),
          control.onChange as ((value: never) => void) | undefined
        ),
      }));
    } else if (control.value !== undefined) {
      chips.push({
        key: `${control.id}-${control.value}`,
        label: control.label
          ? <>{control.label}: {optionLabel(control.options, control.value as FilterValue)}</>
          : optionLabel(control.options, control.value as FilterValue),
        remove: () => emitChange(
          control.id,
          control.clearValue,
          control.onChange as ((value: never) => void) | undefined
        ),
      });
    }
  });

  const rootClassName = ["filter-bar", `filter-bar--${theme}`, disabled ? "filter-bar--disabled" : "", className]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    const toolbar = toolbarRef.current;
    const controlsContainer = controlsRef.current;
    const measurement = radioMeasureRef.current;
    if (!toolbar || !controlsContainer || !measurement || !visibleRadio) {
      setVisibleRadioCount(Number.MAX_SAFE_INTEGER);
      return;
    }

    const updateRadioLayout = () => {
      const optionElements = Array.from(
        measurement.querySelectorAll<HTMLElement>(
          visibleRadio.multiple ? ".ant-checkbox-wrapper" : ".ant-radio-button-wrapper"
        )
      );
      const controlElements = Array.from(
        controlsContainer.children
      ) as HTMLElement[];
      const controlsStyle = window.getComputedStyle(controlsContainer);
      const controlsGap = parseFloat(controlsStyle.columnGap || controlsStyle.gap) || 0;
      const toolbarStyle = window.getComputedStyle(toolbar);
      const toolbarColumnGap =
        parseFloat(toolbarStyle.columnGap || toolbarStyle.gap) || 0;
      const controlsContentWidth = controlElements.reduce(
        (sum, control, index) =>
          sum + control.getBoundingClientRect().width + (index > 0 ? controlsGap : 0),
        0
      );
      const toolbarGap = controlElements.length > 0 ? toolbarColumnGap : 0;
      const isMobileLayout = window.matchMedia("(max-width: 767px)").matches;
      const availableWidth = isMobileLayout
        ? toolbar.clientWidth
        : Math.max(0, toolbar.clientWidth - controlsContentWidth - toolbarGap);
      const optionGap = visibleRadio.multiple ? 16 : 0;
      const totalWidth = optionElements.reduce(
        (sum, option, index) => sum + option.offsetWidth + (index > 0 ? optionGap : 0),
        0
      );
      if (totalWidth <= availableWidth) {
        setVisibleRadioCount(visibleRadio.options.length);
        setOverflowExpanded(false);
        return;
      }

      const overflowSelectWidth = 28;
      const gapWidth = 12;
      const radioBudget = Math.max(0, availableWidth - overflowSelectWidth - gapWidth);
      let usedWidth = 0;
      let nextVisibleCount = 0;
      for (const option of optionElements) {
        const nextOptionWidth = option.offsetWidth + (nextVisibleCount > 0 ? optionGap : 0);
        if (usedWidth + nextOptionWidth > radioBudget) break;
        usedWidth += nextOptionWidth;
        nextVisibleCount += 1;
      }
      setVisibleRadioCount(Math.max(1, nextVisibleCount));
    };
    updateRadioLayout();

    const resizeObserver = new ResizeObserver(updateRadioLayout);
    resizeObserver.observe(toolbar);
    resizeObserver.observe(measurement);
    resizeObserver.observe(controlsContainer);
    Array.from(controlsContainer.children).forEach((control) =>
      resizeObserver.observe(control)
    );
    return () => resizeObserver.disconnect();
  }, [visibleRadio]);

  const visibleRadioOptions = visibleRadio?.options.slice(0, visibleRadioCount) ?? [];
  const overflowRadioOptions = visibleRadio?.options.slice(visibleRadioCount) ?? [];
  const selectedGroupValues = visibleRadio && Array.isArray(visibleRadio.value)
    ? visibleRadio.value
    : [];
  const selectableGroupValues = visibleRadio?.options
    .map((option) => option.value)
    .filter((value) => value !== visibleRadio?.selectAllValue) ?? [];
  const selectedOptionCount = selectableGroupValues.filter((value) =>
    selectedGroupValues.includes(value)
  ).length;
  const selectAllIndeterminate = visibleRadio?.selectAllValue !== undefined
    && !selectedGroupValues.includes(visibleRadio.selectAllValue)
    && selectedOptionCount > 0
    && selectedOptionCount < selectableGroupValues.length;
  const visibleSelectAllOption = visibleRadioOptions.find(
    (option) => option.value === visibleRadio?.selectAllValue
  );
  const visibleStandardOptions = visibleRadioOptions.filter(
    (option) => option.value !== visibleRadio?.selectAllValue
  );
  const optionColorStyle = (option: FilterOption) => option.color
    && option.value !== visibleRadio?.selectAllValue
    ? { "--filter-option-color": option.color } as CSSProperties
    : undefined;
  const renderCheckboxOptions = (options: FilterOption[]) => options.map((option) => (
    <Checkbox
      key={option.value}
      value={option.value}
      disabled={option.disabled}
      style={optionColorStyle(option)}
    >
      {option.label}
    </Checkbox>
  ));
  const changeGroupSelection = (values: FilterValue[]) => {
    if (!visibleRadio) return;
    const currentValues = Array.isArray(visibleRadio.value) ? visibleRadio.value : [];
    const selectAllValue = visibleRadio.selectAllValue;
    if (selectAllValue !== undefined) {
      const hadSelectAll = currentValues.includes(selectAllValue);
      const hasSelectAll = values.includes(selectAllValue);
      if (hasSelectAll && !hadSelectAll) {
        changeRadio(visibleRadio.options.map((option) => option.value));
        return;
      }
      if (!hasSelectAll && hadSelectAll) {
        changeRadio(visibleRadio.clearValue);
        return;
      }
      if (hasSelectAll && hadSelectAll) {
        changeRadio(values.filter((value) => value !== selectAllValue));
        return;
      }
      const individualValues = visibleRadio.options
        .map((option) => option.value)
        .filter((value) => value !== selectAllValue);
      if (
        individualValues.length > 0 &&
        individualValues.every((value) => values.includes(value))
      ) {
        changeRadio(visibleRadio.options.map((option) => option.value));
        return;
      }
    }
    changeRadio(values);
  };
  const changeSelectionRow = (
    rowValues: FilterValue[],
    rowOptions: FilterOption[]
  ) => {
    if (!visibleRadio || !Array.isArray(visibleRadio.value)) return;
    const rowOptionValues = new Set(rowOptions.map((option) => option.value));
    const selectionsFromOtherRows = visibleRadio.value.filter(
      (value) => !rowOptionValues.has(value)
    );
    changeGroupSelection(Array.from(new Set([
      ...selectionsFromOtherRows,
      ...rowValues,
    ])));
  };
  const overflowButton = visibleRadio && overflowRadioOptions.length > 0 ? (
    <Button
      className="filter-bar__more-button"
      size="small"
      shape="circle"
      aria-label={String(visibleRadio.overflowPlaceholder ?? "More options")}
      title={String(visibleRadio.overflowPlaceholder ?? "More options")}
      icon={<DoubleRightOutlined rotate={overflowExpanded ? -90 : 90} />}
      disabled={disabled || visibleRadio.disabled}
      onClick={() => setOverflowExpanded((expanded) => !expanded)}
    />
  ) : null;

  if (loading) {
    return <div className={rootClassName}><Skeleton active paragraph={{ rows: 1 }} title={false} /></div>;
  }

  if (!visibleRadio && visibleControls.length === 0) {
    return <div className={rootClassName}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} /></div>;
  }

  return (
    <div className={rootClassName}>
      <div className="filter-bar__toolbar" ref={toolbarRef}>
        {visibleRadio && (
          <div className={`filter-bar__radio-group${overflowExpanded ? " filter-bar__radio-group--expanded" : ""}`}>
            {visibleRadio.label && <span className="filter-bar__control-label">{visibleRadio.label}</span>}
            {visibleRadio.multiple ? (
              <>
                {visibleSelectAllOption && (
                  <Checkbox
                    className="all-check"
                    disabled={disabled || visibleRadio.disabled || visibleSelectAllOption.disabled}
                    indeterminate={selectAllIndeterminate}
                    checked={selectedGroupValues.includes(visibleSelectAllOption.value)}
                    onChange={(event) => changeRadio(
                      event.target.checked
                        ? visibleRadio.options.map((option) => option.value)
                        : visibleRadio.clearValue
                    )}
                  >
                    {visibleSelectAllOption.label}
                  </Checkbox>
                )}
                {visibleStandardOptions.length > 0 && (
                  <Checkbox.Group
                    className="filter-bar__checkbox-group"
                    value={visibleRadio.value as FilterValue[]}
                    disabled={disabled || visibleRadio.disabled}
                    onChange={(values) => changeSelectionRow(
                      values as FilterValue[],
                      visibleStandardOptions
                    )}
                  >
                    {renderCheckboxOptions(visibleStandardOptions)}
                  </Checkbox.Group>
                )}
              </>
            ) : (
              <Radio.Group
                buttonStyle="solid"
                value={visibleRadio.value}
                disabled={disabled || visibleRadio.disabled}
                onChange={(event) => changeRadio(event.target.value)}
              >
                {visibleRadioOptions.map((option) => (
                  <Radio.Button
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={option.value === visibleRadio.selectAllValue
                      ? "filter-bar__select-all-option"
                      : undefined}
                    style={optionColorStyle(option)}
                  >
                    {option.label}
                  </Radio.Button>
                ))}
              </Radio.Group>
            )}
            {!overflowExpanded && overflowButton}
            {overflowRadioOptions.length > 0 && (
              <div
                className={`filter-bar__overflow-row${overflowExpanded ? " filter-bar__overflow-row--expanded" : ""}`}
                aria-hidden={!overflowExpanded}
              >
                {visibleRadio.multiple ? (
                  <Checkbox.Group
                    className="filter-bar__checkbox-group"
                    value={visibleRadio.value as FilterValue[]}
                    disabled={disabled || visibleRadio.disabled}
                    onChange={(values) => changeSelectionRow(
                      values as FilterValue[],
                      overflowRadioOptions
                    )}
                  >
                    {renderCheckboxOptions(overflowRadioOptions)}
                  </Checkbox.Group>
                ) : (
                  <Radio.Group
                    value={visibleRadio.value}
                    disabled={disabled || visibleRadio.disabled}
                    onChange={(event) => changeRadio(event.target.value)}
                  >
                    {overflowRadioOptions.map((option) => (
                      <Radio.Button
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                        className={option.value === visibleRadio.selectAllValue
                          ? "filter-bar__select-all-option"
                          : undefined}
                        style={optionColorStyle(option)}
                      >
                        {option.label}
                      </Radio.Button>
                    ))}
                  </Radio.Group>
                )}
                {overflowButton}
              </div>
            )}
            <div className="filter-bar__radio-measure" ref={radioMeasureRef} aria-hidden="true">
              {visibleRadio.multiple
                ? <Checkbox.Group options={visibleRadio.options} />
                : <Radio.Group optionType="button" options={visibleRadio.options} />}
            </div>
          </div>
        )}
        <div className="filter-bar__controls" ref={controlsRef}>
          {visibleControls.map((control) => (
            <div
              className={`filter-bar__control${control.type === "search" ? " filter-bar__control--search" : ""}${control.type === "year" ? " filter-bar__control--year" : ""}`}
              key={control.id}
              style={control.type === "search"
                ? { flex: "0 0 auto" }
                : control.width
                  ? { width: control.width, flex: "0 0 auto" }
                  : undefined}
            >
              {control.label && <span className="filter-bar__control-label">{control.label}</span>}
              {control.type === "search" ? (
                <>
                  {control.infoVisible && control.infoDescription != null && (
                    <Popover
                      content={(
                        <div className="filter-bar__info-popover-content">
                          <span>{control.infoDescription}</span>
                          {control.infoLearnMore && (
                            <button
                              type="button"
                              className="filter-bar__learn-more"
                              onClick={() => {
                                setOpenInfoPopoverId(undefined);
                                setOpenInfoDetails(control.infoLearnMore);
                              }}
                            >
                              {control.infoLearnMore.label ?? "Learn more"}
                            </button>
                          )}
                        </div>
                      )}
                      trigger="click"
                      open={openInfoPopoverId === control.id}
                      onOpenChange={(open) => setOpenInfoPopoverId(open ? control.id : undefined)}
                    >
                      <button
                        type="button"
                        className="filter-bar__info-button"
                        aria-label="Search information"
                        disabled={disabled || control.disabled}
                      >
                        <InfoCircleOutlined />
                      </button>
                    </Popover>
                  )}
                  <Search
                    allowClear
                    value={String(control.value ?? "")}
                    placeholder={control.placeholder}
                    disabled={disabled || control.disabled}
                    style={control.width ? { width: control.width } : undefined}
                    onChange={(event) => emitChange(
                      control.id,
                      event.target.value,
                      control.onChange as ((value: never) => void) | undefined
                    )}
                    onPressEnter={(event) => control.onSearch?.(
                      (event.target as HTMLInputElement).value
                    )}
                    onSearch={(value, event) => {
                      if (event?.type !== "keydown") control.onSearch?.(value);
                    }}
                  />
                </>
              ) : control.type === "year" ? (
                <DatePicker
                  picker="year"
                  allowClear
                  value={control.value !== undefined ? moment().year(control.value as number) : null}
                  placeholder={control.placeholder}
                  disabled={disabled || control.disabled}
                  style={control.width ? { width: control.width } : undefined}
                  onChange={(date) => emitChange(
                    control.id,
                    date ? date.year() : undefined,
                    control.onChange as ((value: never) => void) | undefined
                  )}
                />
              ) : (
                <Select
                  allowClear
                  mode={control.mode === "multiple" ? "multiple" : undefined}
                  maxTagCount="responsive"
                  showArrow={control.mode === "multiple" ? true : undefined}
                  showSearch
                  // Server-search selects re-query the backend as you type, so
                  // antd must NOT also client-filter (`filterOption={false}`) —
                  // it only has the current page and would wrongly hide valid
                  // server results. Static selects keep client search by the
                  // visible label (default matches on value/id, not name).
                  {...(control.serverSearch
                    ? {
                        filterOption: false as const,
                        onSearch: control.onSearch,
                        onPopupScroll: control.onPopupScroll,
                        onDropdownVisibleChange: control.onDropdownVisibleChange,
                        notFoundContent: control.loading ? <Spin size="small" /> : undefined,
                      }
                    : { optionFilterProp: "label" as const })}
                  {...(control.mode === "multiple" && !(disabled || control.disabled)
                    ? {
                        dropdownClassName: "filter-bar__dropdown",
                        dropdownRender: (menu: ReactNode) => (
                          <>
                            <div
                              className={`filter-bar__select-all${
                                isAllSelected(control) ? " filter-bar__select-all--selected" : ""
                              }`}
                              role="button"
                              tabIndex={0}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => void toggleSelectAll(control)}
                              onKeyDown={(event) => {
                                if (event.key !== "Enter" && event.key !== " ") return;
                                event.preventDefault();
                                void toggleSelectAll(control);
                              }}
                            >
                              <span>{selectAllLabel}</span>
                              {selectAllLoadingId === control.id && <Spin size="small" />}
                            </div>
                            {menu}
                          </>
                        ),
                      }
                    : {})}
                  listHeight={control.listHeight}
                  value={control.value}
                  options={control.options}
                  placeholder={control.placeholder}
                  disabled={disabled || control.disabled}
                  onChange={(value) => emitChange(
                    control.id,
                    value as FilterControlValue,
                    control.onChange as ((value: never) => void) | undefined
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      {showAppliedFilters && chips.length > 0 && (
        <div className="filter-bar__applied">
          <span className="filter-bar__applied-label">{appliedFiltersLabel}</span>
          <div className="filter-bar__chips">
            {chips.map((chip) => <Tag key={chip.key} closable={!disabled} onClose={chip.remove}>{chip.label}</Tag>)}
          </div>
          <Button type="link" disabled={disabled} onClick={onClearAll}>{clearAllLabel}</Button>
        </div>
      )}
      <Modal
        className="filter-bar__info-modal"
        title={openInfoDetails?.title}
        open={!!openInfoDetails}
        onCancel={() => setOpenInfoDetails(undefined)}
        footer={null}
        width={openInfoDetails?.width ?? 900}
        centered
        destroyOnClose
      >
        <div className="filter-bar__info-modal-content">
          {openInfoDetails?.content}
        </div>
      </Modal>
    </div>
  );
};
