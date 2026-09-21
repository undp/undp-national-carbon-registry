import { useEffect, useMemo, useRef, useState } from "react";
import ELK, { ElkNode } from "elkjs/lib/elk.bundled.js";
import ReactFlow, {
  Background,
  Edge,
  EdgeProps,
  Handle,
  Node,
  Position,
  useNodesInitialized,
  useReactFlow,
  useStoreApi,
} from "reactflow";
import * as Icon from "react-bootstrap-icons";
import { GraphLayout, GraphViewProps, HistoryTreeNode, LaidOutNode } from "./creditHistoryGraph.types";
import {
  areNodesMeasured,
  effectiveChildren,
  fitGraphToScreen,
  FIT_EXTRA_TOP,
  FIT_EXTRA_RIGHT_TOOLBAR,
  getNodeColors,
  ITMO_VIOLET_500,
  mixHexColor,
  pathSegmentProgress,
  withFitMaxZoom,
  ITMO_VIOLET_700,
} from "./creditHistoryGraph.utils";

const elk = new ELK();
const NODE_HEIGHT = 100;
// Matches the <ReactFlow maxZoom> below — restored after a fit's zoom cap.
const DEFAULT_MAX_ZOOM = 3;
// Per-level stagger of the path-highlight cascade.
const PATH_STAGGER_MS = 90;
const PATH_TRANSITION_MS = 260;
const PATH_TRANSITION = `background-color ${PATH_TRANSITION_MS}ms ease, border-color ${PATH_TRANSITION_MS}ms ease, color ${PATH_TRANSITION_MS}ms ease, box-shadow ${PATH_TRANSITION_MS}ms ease`;
// Extra width for the eye icon, which isn't part of the measured label.
const EYE_ICON_RESERVE = 30;
// Caps node width so a selected node's longer "{range} | {note}" wraps rather
// than overrunning neighbors. NOT reflected in ELK height (fixed NODE_HEIGHT
// for all) — giving every node variable height desynced sibling rows and broke
// the connectors; a wrapped selected node overflowing its slot is accepted.
const MAX_NODE_WIDTH = 320;
const measureWidth = (label: string) => Math.min(MAX_NODE_WIDTH, Math.max(110, label.length * 7 + 28 + EYE_ICON_RESERVE));

// "Mr. Tree" is ELK's tree algorithm — children evenly spaced under parents.
const ELK_LAYOUT_OPTIONS: Record<string, string> = {
  "elk.algorithm": "org.eclipse.elk.mrtree",
  "elk.direction": "DOWN",
  "elk.spacing.nodeNode": "50",
  "elk.spacing.componentComponent": "40",
  "org.eclipse.elk.mrtree.spacing.nodeNode": "30",
  "org.eclipse.elk.mrtree.spacing.levelLevel": "70",
};

/**
 * Async top-down tree layout via elkjs. Builds a FLAT node + edge list (not
 * nested `children`) — "Mr. Tree" lays out a flat parent→child edge list
 * correctly, whereas nesting produces a degenerate (empty-looking) layout.
 */
const layoutBinaryElk = async (root: HistoryTreeNode, collapsed: Set<string>): Promise<GraphLayout> => {
  const byId = new Map<string, HistoryTreeNode>();
  const elkNodes: ElkNode[] = [];
  const elkEdges: { id: string; sources: string[]; targets: string[] }[] = [];

  (function collect(node: HistoryTreeNode) {
    byId.set(node.id, node);
    // Reserve width for the widest text this node could show — its label grows
    // to "{range} | {note}" if it ends up on the selected path.
    const widestLabel = node.note && node.note.trim() ? `${node.range} | ${node.note.trim()}` : node.label;
    elkNodes.push({ id: node.id, width: measureWidth(widestLabel), height: NODE_HEIGHT });
    effectiveChildren(node, collapsed).forEach((child) => {
      elkEdges.push({ id: `${node.id}-${child.id}`, sources: [node.id], targets: [child.id] });
      collect(child);
    });
  })(root);

  const result = await elk.layout({
    id: "root",
    layoutOptions: ELK_LAYOUT_OPTIONS,
    children: elkNodes,
    edges: elkEdges,
  });

  const nodes: LaidOutNode[] = (result.children || []).flatMap((elkNode) => {
    const src = byId.get(elkNode.id!);
    if (!src) return [];
    return [
      {
        ...src,
        x: elkNode.x ?? 0,
        y: elkNode.y ?? 0,
        width: elkNode.width ?? measureWidth(src.label),
        height: elkNode.height ?? NODE_HEIGHT,
      },
    ];
  });

  const maxX = Math.max(0, ...nodes.map((n) => n.x + n.width));
  const maxY = Math.max(0, ...nodes.map((n) => n.y + n.height));

  return {
    nodes,
    edges: elkEdges.map((e) => ({ id: e.id, sourceId: e.sources[0], targetId: e.targets[0] })),
    width: maxX + 40,
    height: maxY + 40,
  };
};

interface BinaryTreeNodeData {
  label: string;
  range: string;
  note?: string;
  updateTime?: string;
  isItmo?: boolean;
  itmoSerial?: string | null;
  retireSubType?: string | null;
  isRoot: boolean;
  hasChildren: boolean;
  collapsed: boolean;
  onPath: boolean;
  selected: boolean;
  /** This node's depth × `PATH_STAGGER_MS` — how long the color transition
   * waits before starting, so the path-highlight visibly cascades from
   * root to the selected node instead of the whole lineage snapping to
   * blue at once. */
  pathDelayMs: number;
  /** When false, `onClick` is a no-op and the cursor stays default. */
  interactiveSelection: boolean;
  /** Whether this node's detail panel is expanded — driven by the shared
   * `expandedDetailIds` set (per-node eye button, or the toolbar's "all"
   * master toggle). */
  showInfo: boolean;
  onClick: () => void;
  onToggle: (e: React.MouseEvent) => void;
  onToggleDetail: () => void;
}

const BinaryTreeNode = ({ data }: { data: BinaryTreeNodeData }) => {
  const {
    label,
    range,
    note,
    updateTime,
    isItmo,
    itmoSerial,
    retireSubType,
    isRoot,
    hasChildren,
    collapsed,
    onPath,
    selected,
    pathDelayMs,
    interactiveSelection,
    showInfo,
    onClick,
    onToggle,
    onToggleDetail,
  } = data;
  const noteText = note && note.trim() ? note.trim() : null;
  // The expanded height isn't in ELK's layout, so an open node can overlap
  // the row below — accepted for inline info.
  // On-path labels already read "{range} | {note}"; off-path labels are bare
  // range, so the eye toggle builds the same text to show it in the same spot.
  const displayLabel = showInfo && !onPath && noteText ? `${range} | ${noteText}` : label;

  const { background, color, borderColor, accentBorderLeft } = getNodeColors({ selected, onPath, isRoot, isItmo });

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        // React Flow disables pointer events on nodes unless drag/select props
        // are set (we don't); re-enable so our own click handling works.
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        padding: "10px 18px",
        borderRadius: 10,
        border: `${selected ? 2 : 1.4}px solid ${borderColor}`,
        ...(accentBorderLeft ? { borderLeft: accentBorderLeft } : {}),
        background,
        color,
        fontSize: 14,
        fontWeight: isRoot ? 700 : onPath ? 600 : 500,
        cursor: interactiveSelection ? "pointer" : "default",
        maxWidth: MAX_NODE_WIDTH,
        boxShadow: selected ? (isItmo ? "0 0 0 4px rgba(124,58,237,0.15)" : "0 0 0 4px rgba(24,144,255,0.15)") : "none",
        transition: PATH_TRANSITION,
        // Delay only while *becoming* on-path (the cascade); clear instantly
        // when leaving the path so it doesn't linger past the new selection.
        transitionDelay: onPath ? `${pathDelayMs}ms` : "0ms",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ visibility: "hidden" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <span style={{ whiteSpace: "normal", wordBreak: "break-word", minWidth: 0, flex: 1 }}>{displayLabel}</span>
        <button
          className="nodrag nopan"
          onClick={(e) => {
            e.stopPropagation();
            onToggleDetail();
          }}
          style={{
            border: "none",
            background: "none",
            padding: 0,
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            cursor: "pointer",
            color: showInfo ? (selected ? "#fff" : "#0b6dc7") : selected ? "#e6f4ff" : "#94a3b8",
          }}
        >
          {showInfo ? <Icon.EyeSlashFill size={13} /> : <Icon.EyeFill size={13} />}
        </button>
      </div>
      {showInfo && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            textAlign: "left",
            gap: 2,
            marginTop: 2,
            paddingTop: 6,
            // Divider above the expanded details; pale on the selected node.
            borderTop: `1px solid ${selected ? "rgba(255,255,255,0.3)" : "rgba(15,23,42,0.12)"}`,
            fontSize: 11.5,
            fontWeight: 400,
            color: selected ? "#e6f4ff" : "#64748b",
          }}
        >
          {/* The note shows next to the range via label/displayLabel, so this
           * panel only adds the update time plus, when relevant, the ITMO
           * serial and retirement subType — neither of which can live in
           * the note itself without breaking TimelineGraphView's
           * trailing-company-name link (see formatActionNote). */}
          <span>{updateTime || "No update time available"}</span>
          {itmoSerial && <span>ITMO Serial: {itmoSerial}</span>}
          {retireSubType && <span>Retired for: {retireSubType}</span>}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ visibility: "hidden" }} />
      {hasChildren && (
        // Bottom-center, where the outgoing edges originate.
        <button
          className="nodrag nopan"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(e);
          }}
          style={{
            position: "absolute",
            bottom: -9,
            left: "50%",
            transform: "translateX(-50%)",
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: `1.3px solid ${collapsed ? isItmo? ITMO_VIOLET_700  :  "#0b6dc7" : "#94a3b8"}`,
            background: collapsed ? isItmo? ITMO_VIOLET_500  : "#1890ff" : "#fff",
            color: collapsed ? "#fff" : "#64748b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {collapsed ? <Icon.Plus size={10} /> : <Icon.Dash size={10} />}
        </button>
      )}
    </div>
  );
};

// Elbow connector: down to the mid-row, across, then down into the child
// (hard right angles). Siblings' shared mid-row segment overlaps, reading as
// one horizontal line with branches dropping off it.
const BinaryTreeEdge = ({ sourceX, sourceY, targetX, targetY, style }: EdgeProps) => {
  const midY = (sourceY + targetY) / 2;
  const path = `M ${sourceX},${sourceY} L ${sourceX},${midY} L ${targetX},${midY} L ${targetX},${targetY}`;
  return <path d={path} fill="none" style={style} className="react-flow__edge-path" />;
};

const nodeTypes = { binaryTreeNode: BinaryTreeNode };
const edgeTypes = { binaryTree: BinaryTreeEdge };

/**
 * Vertical top-down tree via elkjs's "Mr. Tree". Layout is async so it runs in
 * an effect, not a useMemo. Self-contained (layout + rendering).
 */
export const BinaryTreeGraphView = ({
  root,
  collapsed,
  selectedId,
  pathIds,
  interactiveSelection,
  showCollapseToggle,
  fitScope,
  isDefaultStateReady,
  maxZoom,
  expandedDetailIds,
  onSelectNode,
  onToggleCollapse,
  onToggleNodeDetail,
}: GraphViewProps) => {
  const { getNodes, fitBounds } = useReactFlow();
  const storeApi = useStoreApi();
  const nodesInitialized = useNodesInitialized();
  const [layout, setLayout] = useState<GraphLayout | null>(null);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // `cancelled` guards against a stale elk.layout() promise resolving after
  // `root`/`collapsed` has already moved on to a newer request.
  useEffect(() => {
    let cancelled = false;
    setComputing(true);
    setError(null);
    layoutBinaryElk(root, collapsed)
      .then((result) => {
        if (!cancelled) setLayout(result);
      })
      .catch((err) => {
        console.error("[BinaryTreeGraphView] elkjs layout failed", err);
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setComputing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [root, collapsed]);

  // Progress (0→1) of the ordered edge-by-edge path reveal; plain state (not
  // CSS) so edges light strictly in sequence, not all at once.
  const [pathAnimProgress, setPathAnimProgress] = useState(1);
  // Seeded with the current selectedId (not null) so a Timeline/Binary remount
  // with an unchanged selection doesn't replay the reveal.
  const animatedSelectedIdRef = useRef<string | null>(selectedId);

  useEffect(() => {
    if (!selectedId || selectedId === animatedSelectedIdRef.current) return;
    animatedSelectedIdRef.current = selectedId;
    const totalSegments = Math.max(0, pathIds.size - 1);
    if (totalSegments === 0) {
      setPathAnimProgress(1);
      return;
    }
    // Longer chains animate longer (capped) so each segment stays perceptible.
    const duration = Math.min(650, Math.max(280, totalSegments * 160));
    const start = performance.now();
    setPathAnimProgress(0);
    let raf: number;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setPathAnimProgress(t);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [selectedId, pathIds]);

  const pathTotalSegments = Math.max(0, pathIds.size - 1);

  // `pathIds` is only the path *to* the selected node, but its direct children
  // are also rendered — include them so the path-only fit doesn't clip them.
  const initialFitIds = useMemo(() => {
    if (!pathIds.size || !selectedId) return pathIds;
    const ids = new Set(pathIds);
    (layout?.nodes ?? []).forEach((n) => {
      if (n.parent?.id === selectedId) ids.add(n.id);
    });
    return ids;
  }, [layout, pathIds, selectedId]);

  const nodes: Node<BinaryTreeNodeData>[] = useMemo(
    () =>
      (layout?.nodes ?? []).map((n) => ({
        id: n.id,
        type: "binaryTreeNode",
        position: { x: n.x, y: n.y },
        draggable: false,
        data: {
          // On-path labels show "{range} | {note}"; off-path fall back to the
          // bare range (the eye toggle still reveals their note on demand).
          label: pathIds.has(n.id) ? (n.note && n.note.trim() ? `${n.range} | ${n.note.trim()}` : n.range) : n.range,
          range: n.range,
          note: n.note,
          updateTime: n.updateTime,
          isItmo: n.isItmo,
          itmoSerial: n.itmoSerial,
          retireSubType: n.retireSubType,
          isRoot: n.depth === 0,
          hasChildren: showCollapseToggle && n.children.length > 0,
          collapsed: collapsed.has(n.id),
          onPath: pathIds.has(n.id),
          selected: n.id === selectedId,
          pathDelayMs: n.depth * PATH_STAGGER_MS,
          interactiveSelection,
          showInfo: expandedDetailIds.has(n.id),
          onClick: interactiveSelection ? () => onSelectNode(n.id) : () => {},
          onToggle: () => onToggleCollapse(n.id),
          onToggleDetail: () => onToggleNodeDetail(n.id),
        },
      })),
    [
      layout,
      collapsed,
      pathIds,
      selectedId,
      interactiveSelection,
      showCollapseToggle,
      expandedDetailIds,
      onSelectNode,
      onToggleCollapse,
      onToggleNodeDetail,
    ]
  );

  // Per-edge depth lookup, for the highlight cascade timing; per-edge ITMO
  // lookup, so the path highlight can turn violet on the segments leading
  // into an ITMO node instead of the default blue.
  const depthById = useMemo(() => {
    const map = new Map<string, number>();
    (layout?.nodes ?? []).forEach((n) => map.set(n.id, n.depth));
    return map;
  }, [layout]);
  const isItmoById = useMemo(() => {
    const map = new Map<string, boolean>();
    (layout?.nodes ?? []).forEach((n) => map.set(n.id, !!n.isItmo));
    return map;
  }, [layout]);

  const edges: Edge[] = useMemo(
    () =>
      (layout?.edges ?? [])
        .map((e) => {
          const onPath = pathIds.has(e.sourceId) && pathIds.has(e.targetId);
          // targetDepth - 1 → 0-based segment index in the root→selected chain.
          const targetDepth = depthById.get(e.targetId) ?? 0;
          const alpha = onPath ? pathSegmentProgress(targetDepth - 1, pathTotalSegments, pathAnimProgress) : 0;
          // An edge represents the action that produced its target, so it's
          // "ITMO" when the target is - e.g. the edge into an ITMO_AUTH node,
          // or into a later RETIRE/TRANSFER of already-authorized credits.
          const targetIsItmo = isItmoById.get(e.targetId) ?? false;
          const pathColor = targetIsItmo ? ITMO_VIOLET_500 : "#1890ff";
          const glowRgb = targetIsItmo ? "139, 92, 246" : "24, 144, 255";
          return {
            id: e.id,
            source: e.sourceId,
            target: e.targetId,
            type: "binaryTree",
            onPath,
            style: {
              stroke: onPath ? mixHexColor("#aab1bd", pathColor, alpha) : "#aab1bd",
              strokeWidth: onPath ? 1.4 + (2.6 - 1.4) * alpha : 1.4,
              // Glow that fades in with the segment (same alpha as color/width).
              filter: onPath ? `drop-shadow(0 0 3px rgba(${glowRgb}, ${(0.65 * alpha).toFixed(2)}))` : "none",
            },
          };
        })
        // SVG paints in order — sort on-path edges last so they stay on top.
        .sort((a, b) => Number(a.onPath) - Number(b.onPath)),
    [layout, pathIds, depthById, isItmoById, pathTotalSegments, pathAnimProgress]
  );

  // Fits on mount and every layout change, via our own fitGraphToScreen (to
  // clear the floating toolbar). Gated on `isDefaultStateReady` so it doesn't
  // fit the transient pre-default tree, and polls `areNodesMeasured` since
  // `useNodesInitialized()` can flip true a frame before widths are real.
  useEffect(() => {
    if (!layout || !nodesInitialized || !isDefaultStateReady) return;
    let rafId: number;
    let attempts = 0;
    const MAX_ATTEMPTS = 60; // ~1s cap so a stuck measurement still fits eventually

    const tryFit = () => {
      attempts += 1;
      if (!areNodesMeasured(getNodes()) && attempts < MAX_ATTEMPTS) {
        rafId = requestAnimationFrame(tryFit);
        return;
      }
      const useScope = fitScope === "path" && initialFitIds.size > 0;
      fitGraphToScreen(
        getNodes,
        withFitMaxZoom(fitBounds, (z) => storeApi.getState().setMaxZoom(z), maxZoom, DEFAULT_MAX_ZOOM),
        {
          extraTop: FIT_EXTRA_TOP,
          // Clearance so the top-right node isn't tucked under the toolbar.
          extraRight: FIT_EXTRA_RIGHT_TOOLBAR,
          filter: useScope ? (n) => initialFitIds.has(n.id) : undefined,
        }
      );
    };
    rafId = requestAnimationFrame(tryFit);
    return () => cancelAnimationFrame(rafId);
  }, [
    layout,
    nodesInitialized,
    isDefaultStateReady,
    getNodes,
    fitBounds,
    fitScope,
    initialFitIds,
    maxZoom,
    storeApi,
  ]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {computing && <div className="chg-layout-loading">Laying out tree…</div>}
      {error && <div className="chg-layout-error">Couldn't lay out the tree: {error}</div>}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
        minZoom={0.1}
        maxZoom={3}
      >
        <Background gap={20} color="#e9edf3" />
      </ReactFlow>
    </div>
  );
};
