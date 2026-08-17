import { Button, message, Popover, Tag } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { getCreditTypeTagColor } from "./creditTableHelpers";
import "../creditPageStyles.scss";

export interface CreditTypePillProps {
  isItmo: boolean;
  itmoSerial?: string | null;
  // Loosely typed (rather than i18next's TFunction) so this matches
  // however each caller happens to type its own `t` — some type it as
  // TFunction, some as `(key: string) => string`, some leave it `any`.
  t: (key: string) => string;
}

// MO/ITMO classifier pill used wherever a credit block (or a
// block-derived transaction: retirement, explorer row, balance row) is
// listed. ITMO blocks carry their own Dec 6/CMA.4 Annex I para 5
// identifier (itmoSerial) — when present, the pill becomes interactive:
// hover previews it, click pins the popover open, and a copy button is
// offered. MO pills, and ITMO pills with no resolvable serial yet, are
// inert.
export const CreditTypePill = ({ isItmo, itmoSerial, t }: CreditTypePillProps) => {
  const label = isItmo ? t("itmo") : t("mo");
  const tag = <Tag color={getCreditTypeTagColor(isItmo)}>{label}</Tag>;

  if (!isItmo || !itmoSerial) {
    return tag;
  }

  const handleCopy = () => {
    void navigator.clipboard.writeText(itmoSerial).then(() => {
      message.success(t("itmoSerialCopied"));
    });
  };

  return (
    <Popover
      trigger={["hover", "click"]}
      placement="top"
      content={
        <div className="credit-type-pill-popover">
          <span className="credit-type-pill-popover__label">
            {t("itmoSerial")}
          </span>
          <span className="credit-type-pill-popover__serial">
            {itmoSerial}
          </span>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={handleCopy}
            aria-label={t("copy")}
          />
        </div>
      }
    >
      <span
        className="credit-type-pill--interactive"
        role="button"
        tabIndex={0}
      >
        {tag}
      </span>
    </Popover>
  );
};
