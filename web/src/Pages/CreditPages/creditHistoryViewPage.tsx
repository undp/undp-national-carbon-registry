import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { CreditHistoryGraph } from "../../Components/CreditHistoryGraph/CreditHistoryGraph";
import { CreditHistoryEntry, GraphMode } from "../../Components/CreditHistoryGraph/creditHistoryGraph.types";

// TODO: remove once the credit-block backend endpoint exists — there's no
// way to re-fetch a block's history by serial number yet, so the data is
// handed off via sessionStorage (keyed by a UUID in the URL) by whoever
// opens this tab (CreditHistoryGraph's fullscreen button) instead. Relies
// on same-origin tabs opened via window.open() getting a copy of the
// opener's sessionStorage at open time.
export const CreditHistoryViewPage = () => {
  const [searchParams] = useSearchParams();

  const entries = useMemo<CreditHistoryEntry[]>(() => {
    const key = searchParams.get("key");
    if (!key) return [];
    const raw = sessionStorage.getItem(`history-${key}`);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }, [searchParams]);

  const serial = searchParams.get("serial") ?? undefined;
  const focusRange = searchParams.get("focusRange") ?? undefined;
  const interactiveSelection = searchParams.get("interactiveSelection") !== "false";
  const collapseStrategy = (searchParams.get("collapseStrategy") as "depth" | "pathOnly") || "depth";
  const defaultSelection = (searchParams.get("defaultSelection") as "auto" | "none") || "auto";
  const highlightCreditParam = searchParams.get("highlightCredit");
  const highlightCredit = highlightCreditParam !== null && /^\d+$/.test(highlightCreditParam)
    ? Number(highlightCreditParam)
    : undefined;
  const parseMode = (value: string | null): GraphMode | undefined =>
    value === "binary" || value === "timeline" ? value : undefined;
  const defaultMode = parseMode(searchParams.get("defaultMode"));
  const initialMode = parseMode(searchParams.get("initialMode"));

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", padding: 24, boxSizing: "border-box" }}>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, flexShrink: 0 }}>
        History{serial ? ` — ${serial}` : ""}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {entries.length ? (
          <CreditHistoryGraph
            entries={entries}
            serial={serial}
            focusRange={focusRange}
            interactiveSelection={interactiveSelection}
            collapseStrategy={collapseStrategy}
            defaultSelection={defaultSelection}
            defaultMode={defaultMode}
            initialMode={initialMode}
            showOpenInNewTab={false}
            height="100%"
            highlightCredit={highlightCredit}
            // A small tree fit into this tab's full-viewport canvas would
            // otherwise zoom in well past 100% — cap it so nodes stay a
            // sane, readable size regardless of how few there are.
            maxZoom={1}
          />
        ) : (
          <div>No history data available.</div>
        )}
      </div>
    </div>
  );
};
