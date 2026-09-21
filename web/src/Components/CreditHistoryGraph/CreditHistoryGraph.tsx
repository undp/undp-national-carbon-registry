import { useEffect, useMemo, useState } from "react";
import { ReactFlowProvider, useReactFlow, useStoreApi } from "reactflow";
import "reactflow/dist/style.css";
import { Tooltip } from "antd";
import * as Icon from "react-bootstrap-icons";
import { TimelineGraphView } from "./TimelineGraphView";
import { BinaryTreeGraphView } from "./BinaryTreeGraphView";
import { CreditHistoryEntry, GraphMode, GraphViewProps, HistoryTreeNode } from "./creditHistoryGraph.types";
import {
  buildHistoryTree,
  collapseAllExceptPath,
  defaultCollapse,
  findDefaultTarget,
  findNodeByRange,
  fitGraphToScreen,
  FIT_EXTRA_TOP,
  FIT_EXTRA_RIGHT_TOOLBAR,
  getPathToRoot,
  measureNoteWidth,
  withFitMaxZoom,
} from "./creditHistoryGraph.utils";
import "./creditHistoryGraph.scss";

// Matches the `maxZoom` prop both views set on their own <ReactFlow> — the
// scale-extent a fit's zoom cap (see `withFitMaxZoom`) restores to once its
// animation settles, so manual zoom/pinch afterward isn't left capped.
const DEFAULT_MAX_ZOOM = 3;

const indexTree = (root: HistoryTreeNode): Map<string, HistoryTreeNode> => {
  const map = new Map<string, HistoryTreeNode>();
  const walk = (n: HistoryTreeNode) => {
    map.set(n.id, n);
    n.children.forEach(walk);
  };
  walk(root);
  return map;
};

interface GraphShellProps {
  entries: CreditHistoryEntry[];
  onOpenFullView: (mode: GraphMode) => void;
  focusRange?: string;
  interactiveSelection: boolean;
  collapseStrategy: "depth" | "pathOnly";
  showCollapseToggle: boolean;
  showOpenInNewTab: boolean;
  showModeToggle: boolean;
  defaultSelection: "auto" | "none";
  defaultMode: GraphMode;
  initialMode: GraphMode;
  initialFitScope: "all" | "path";
  highlightCredit?: number;
  maxZoom?: number;
}

/**
 * Owns the tree/selection/collapse state and toolbar chrome shared by both
 * views, and picks which view is mounted. The views are self-contained.
 */
const GraphShell = ({
  entries,
  onOpenFullView,
  focusRange,
  interactiveSelection,
  collapseStrategy,
  showCollapseToggle,
  showOpenInNewTab,
  showModeToggle,
  defaultSelection,
  defaultMode,
  initialMode,
  initialFitScope,
  highlightCredit,
  maxZoom,
}: GraphShellProps) => {
  const root = useMemo(() => buildHistoryTree(entries), [entries]);
  const nodeIndex = useMemo(() => (root ? indexTree(root) : null), [root]);
  const [mode, setMode] = useState<GraphMode>(initialMode);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Binary Tree's per-node detail panels — IDs currently expanded. Master
  // toggle (toolbar eye icon) sets/clears every ID at once; the per-node eye
  // button toggles just its own ID via `onToggleNodeDetail`.
  const [expandedDetailIds, setExpandedDetailIds] = useState<Set<string>>(new Set());
  // False until `applyDefaultState` runs — gates the views' initial fit past
  // the first paint, which happens with untouched initial state.
  const [isDefaultStateReady, setIsDefaultStateReady] = useState(false);
  // True from mount / after "Reset view" until the first interaction — drives
  // `fitScope`, so `initialFitScope` applies on every reset, not just mount.
  const [isDefaultState, setIsDefaultState] = useState(true);

  // Used by the initial-state effect and "Reset view". `focusRange` pins the
  // path to a specific block; `defaultSelection: "none"` highlights nothing
  // until a click.
  const applyDefaultState = (r: HistoryTreeNode) => {
    const target =
      (focusRange && findNodeByRange(r, focusRange)) ||
      (defaultSelection === "none" ? null : findDefaultTarget(r));
    setCollapsed(collapseStrategy === "pathOnly" ? collapseAllExceptPath(r, target) : defaultCollapse(r, target));
    setSelectedId(target ? target.id : null);
    setExpandedDetailIds(new Set());
    setIsDefaultStateReady(true);
    setIsDefaultState(true);
  };

  useEffect(() => {
    if (!root) return;
    applyDefaultState(root);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, focusRange, collapseStrategy, defaultSelection]);

  // Restores collapse/selection to defaults; the resulting collapsed/selectedId
  // change is what the views' re-fit effect keys off to recenter.
  const onResetView = () => {
    if (!root) return;
    applyDefaultState(root);
  };

  const pathIds = useMemo(() => {
    if (!nodeIndex || !selectedId) return new Set<string>();
    const node = nodeIndex.get(selectedId);
    return node ? getPathToRoot(node) : new Set<string>();
  }, [nodeIndex, selectedId]);

  // "path" only while untouched since mount/reset; "all" after any interaction.
  const fitScope: "all" | "path" = isDefaultState ? initialFitScope : "all";

  const onSelectNode = (id: string) => {
    setSelectedId((cur) => (cur === id ? null : id));
    setIsDefaultState(false);
  };
  const onToggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setIsDefaultState(false);
  };
  const onToggleNodeDetail = (id: string) => {
    setExpandedDetailIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!root) return null;

  const allNodeIds = nodeIndex ? Array.from(nodeIndex.keys()) : [];
  const allDetailsExpanded =
    allNodeIds.length > 0 && allNodeIds.every((id) => expandedDetailIds.has(id));
  const onToggleAllDetails = () =>
    setExpandedDetailIds(allDetailsExpanded ? new Set() : new Set(allNodeIds));

  const viewProps = {
    root,
    collapsed,
    selectedId,
    pathIds,
    interactiveSelection,
    showCollapseToggle,
    fitScope,
    isDefaultStateReady,
    creditMarkerLabel: highlightCredit !== undefined ? `Credit #${highlightCredit} is located here` : undefined,
    maxZoom,
    expandedDetailIds,
    onSelectNode,
    onToggleCollapse,
    onToggleNodeDetail,
  };

  return (
    <div className="credit-history-graph">
      {/* Keyed on `mode` so each view gets its own provider/store — react-flow's
       * store can't be shared across <ReactFlow> instances (xyflow#5689). */}
      <ReactFlowProvider key={mode}>
        <GraphToolbarAndView
          mode={mode}
          defaultMode={defaultMode}
          onToggleMode={() => setMode((m) => (m === "timeline" ? "binary" : "timeline"))}
          onOpenFullView={onOpenFullView}
          showOpenInNewTab={showOpenInNewTab}
          showModeToggle={showModeToggle}
          onResetView={onResetView}
          showAllDetails={allDetailsExpanded}
          onToggleAllDetails={onToggleAllDetails}
          viewProps={viewProps}
        />
      </ReactFlowProvider>
    </div>
  );
};

interface GraphToolbarAndViewProps {
  mode: GraphMode;
  defaultMode: GraphMode;
  onToggleMode: () => void;
  onOpenFullView: (mode: GraphMode) => void;
  showOpenInNewTab: boolean;
  showModeToggle: boolean;
  onResetView: () => void;
  /** Whether every node's detail panel is currently expanded (Binary Tree
   * only) — drives the toolbar eye icon's on/off state. */
  showAllDetails: boolean;
  onToggleAllDetails: () => void;
  viewProps: GraphViewProps;
}

/** Toolbar + the active view, both inside the same per-mode
 * ReactFlowProvider — the toolbar's zoom/pan controls need useReactFlow(),
 * which only works for the <ReactFlow> instance sharing its provider. */
const GraphToolbarAndView = ({
  mode,
  defaultMode,
  onToggleMode,
  onOpenFullView,
  showOpenInNewTab,
  showModeToggle,
  onResetView,
  showAllDetails,
  onToggleAllDetails,
  viewProps,
}: GraphToolbarAndViewProps) => {
  const { zoomIn, zoomOut, getNodes, fitBounds } = useReactFlow();
  const storeApi = useStoreApi();
  // getExtraRight: reserve room for Timeline's overflowing note text (Binary
  // Tree keeps info inside the node). extraRight: fixed gap for the floating
  // toolbar, only needed in Binary Tree. extraTop: clearance for the
  // floating mode-toggle/toolbar, needed regardless of mode.
  const fitToScreen = () =>
    fitGraphToScreen(
      getNodes,
      withFitMaxZoom(fitBounds, (z) => storeApi.getState().setMaxZoom(z), viewProps.maxZoom, DEFAULT_MAX_ZOOM),
      {
        // The note is split across notePrefix/companyName/updateTime (so the
        // company can be its own link) — reassemble the full text to measure.
        getExtraRight:
          mode === "timeline"
            ? (n) =>
                measureNoteWidth(
                  `${n.data?.creditMarker ? `${n.data.creditMarker}    ` : ""}${n.data?.notePrefix ?? ""}${n.data?.companyName ?? ""}${n.data?.updateTime ? ` | ${n.data.updateTime}` : ""}`
                )
            : undefined,
        extraTop: FIT_EXTRA_TOP,
        extraRight: mode === "binary" ? FIT_EXTRA_RIGHT_TOOLBAR : 0,
      }
    );

  const binaryButton = (
    <button
      key="binary"
      className={mode === "binary" ? "active" : undefined}
      onClick={() => mode !== "binary" && onToggleMode()}
    >
      Binary Tree
    </button>
  );
  const timelineButton = (
    <button
      key="timeline"
      className={mode === "timeline" ? "active" : undefined}
      onClick={() => mode !== "timeline" && onToggleMode()}
    >
      Timeline
    </button>
  );
  // Opening mode leads; button order stays fixed regardless of toggling.
  const modeButtons = defaultMode === "binary" ? [binaryButton, timelineButton] : [timelineButton, binaryButton];

  return (
    <>
      <div className="chg-canvas-wrap">
          {mode === "timeline" ? <TimelineGraphView {...viewProps} /> : <BinaryTreeGraphView {...viewProps} />}
          {showModeToggle && <div className="chg-mode-toggle chg-floating-mode-toggle">{modeButtons}</div>}
          <div className="chg-floating-toolbar">
            <Tooltip title="Zoom in" placement="bottom" overlayClassName="chg-toolbar-tooltip">
              <button className="chg-icon-btn" onClick={() => zoomIn()}>
                <Icon.PlusLg />
              </button>
            </Tooltip>
            <Tooltip title="Zoom out" placement="bottom" overlayClassName="chg-toolbar-tooltip">
              <button className="chg-icon-btn" onClick={() => zoomOut()}>
                <Icon.DashLg />
              </button>
            </Tooltip>
            <Tooltip title="Fit to screen" placement="bottom" overlayClassName="chg-toolbar-tooltip">
              <button className="chg-icon-btn" onClick={fitToScreen}>
                <Icon.AspectRatio />
              </button>
            </Tooltip>
            <Tooltip title="Reset view" placement="bottom" overlayClassName="chg-toolbar-tooltip">
              <button className="chg-icon-btn" onClick={onResetView}>
                <Icon.ArrowCounterclockwise />
              </button>
            </Tooltip>
            {mode === "binary" && (
              <Tooltip
                title={showAllDetails ? "Hide details on all nodes" : "Show details on all nodes"}
                placement="bottom"
                overlayClassName="chg-toolbar-tooltip"
              >
                <button className="chg-icon-btn" onClick={onToggleAllDetails}>
                  {showAllDetails ? <Icon.EyeSlashFill /> : <Icon.EyeFill />}
                </button>
              </Tooltip>
            )}
            {showOpenInNewTab && (
              <Tooltip title="Open in new tab" placement="bottom" overlayClassName="chg-toolbar-tooltip">
                <button className="chg-icon-btn" onClick={() => onOpenFullView(mode)}>
                  <Icon.ArrowsFullscreen />
                </button>
              </Tooltip>
            )}
          </div>
      </div>
      <div className="chg-hint-bar">
        Scroll to zoom in/out · Drag to pan
        {viewProps.interactiveSelection && " · Click a node to trace its path"}
        {viewProps.showCollapseToggle && " · Click +/- to expand/collapse"}
      </div>
    </>
  );
};

export interface CreditHistoryGraphProps {
  entries: CreditHistoryEntry[];
  /** Shown in the fullscreen panel header. */
  serial?: string;
  /** Height of the inline (non-fullscreen) graph. Defaults to 40vh so it
   * scales with the viewport instead of a fixed pixel value. */
  height?: number | string;
  /** Node range to lock the highlighted path to (e.g. the "View"ed block).
   * Falls back to the deepest/most-recent leaf. */
  focusRange?: string;
  /** Whether clicking a node re-traces the path. false locks it to `focusRange`
   * (the +/- toggle still works). Defaults to true. */
  interactiveSelection?: boolean;
  /** "depth" (default): collapse depth 3+. "pathOnly": collapse all off the
   * focus/default path. */
  collapseStrategy?: "depth" | "pathOnly";
  /** Whether nodes show their +/- expand/collapse toggle. Defaults to true. */
  showCollapseToggle?: boolean;
  /** Whether the toolbar shows the "open in new tab" button. Defaults to true. */
  showOpenInNewTab?: boolean;
  /** Whether the toolbar shows the Timeline/Binary Tree mode toggle. Defaults to true. */
  showModeToggle?: boolean;
  /** "auto" (default): highlight on open. "none": nothing until a click
   * (`focusRange` still wins). */
  defaultSelection?: "auto" | "none";
  /** Which view the graph opens in, and — together with `showModeToggle` —
   * the Timeline/Binary Tree button order. Defaults to "timeline". */
  defaultMode?: GraphMode;
  /** Which mode is actually selected on open. Defaults to `defaultMode`; the
   * fullscreen tab sets this to whatever the popup was last toggled to
   * (`defaultMode` there stays the page's own default so button order still
   * matches the popup). */
  initialMode?: GraphMode;
  /** Scope of the first fit. "all" (default) fits every visible node; "path"
   * fits only the traced path (for Explorer's pathOnly tree). Later re-fits
   * always use "all". */
  initialFitScope?: "all" | "path";
  /** A searched single-credit number — marks the selected block's node with a
   * "Credit #N" callout. */
  highlightCredit?: number;
  /** Caps "Fit to screen" zoom-in (see `fitGraphToScreen`) — unset inline; the
   * fullscreen tab passes 1 so a small tree isn't oversized. */
  maxZoom?: number;
}

export const CreditHistoryGraph = ({
  entries,
  serial,
  height = "40vh",
  focusRange,
  interactiveSelection = true,
  collapseStrategy = "depth",
  showCollapseToggle = true,
  showOpenInNewTab = true,
  showModeToggle = true,
  defaultSelection = "auto",
  defaultMode = "timeline",
  initialMode,
  initialFitScope = "all",
  highlightCredit,
  maxZoom,
}: CreditHistoryGraphProps) => {
  // Hands the entries to the new tab via sessionStorage (a same-origin
  // window.open() copies the opener's sessionStorage at open time) rather than
  // a query param, so the URL stays short. No noopener — that would break the
  // sessionStorage inheritance this relies on.
  // `mode` is the toggle the inline graph is *currently* showing, passed
  // through as `initialMode` so the full view opens pre-selected there.
  // `defaultMode` is sent as-is (the page's own static default) so button
  // order in the fullscreen tab matches the popup regardless of what's
  // currently selected.
  const onOpenNewTab = (mode: GraphMode) => {
    const key = crypto.randomUUID();
    sessionStorage.setItem(`history-${key}`, JSON.stringify(entries));
    const params = new URLSearchParams();
    params.set("key", key);
    if (serial) params.set("serial", serial);
    if (focusRange) params.set("focusRange", focusRange);
    params.set("interactiveSelection", String(interactiveSelection));
    params.set("collapseStrategy", collapseStrategy);
    params.set("defaultSelection", defaultSelection);
    params.set("defaultMode", defaultMode);
    params.set("initialMode", mode);
    if (highlightCredit !== undefined) params.set("highlightCredit", String(highlightCredit));
    window.open(`/credits/historyView?${params.toString()}`, "_blank");
  };

  return (
    <div className="credit-history-graph-inline" style={{ height }}>
      <GraphShell
        entries={entries}
        onOpenFullView={onOpenNewTab}
        focusRange={focusRange}
        interactiveSelection={interactiveSelection}
        collapseStrategy={collapseStrategy}
        showCollapseToggle={showCollapseToggle}
        showOpenInNewTab={showOpenInNewTab}
        showModeToggle={showModeToggle}
        defaultSelection={defaultSelection}
        defaultMode={defaultMode}
        initialMode={initialMode ?? defaultMode}
        initialFitScope={initialFitScope}
        highlightCredit={highlightCredit}
        maxZoom={maxZoom}
      />
    </div>
  );
};
