import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactFlow, {
  Background,
  Edge,
  EdgeProps,
  Handle,
  MarkerType,
  Node,
  Position,
  useNodesInitialized,
  useReactFlow,
  useStoreApi,
} from "reactflow";
import * as Icon from "react-bootstrap-icons";
import { ROUTES } from "../../Config/uiRoutingConfig";
import { GraphLayout, GraphViewProps, HistoryTreeNode, LaidOutNode } from "./creditHistoryGraph.types";
import {
  areNodesMeasured,
  effectiveChildren,
  fitGraphToScreen,
  FIT_EXTRA_TOP,
  getNodeColors,
  ITMO_VIOLET_500,
  ITMO_VIOLET_700,
  measureNoteWidth,
  mixHexColor,
  pathSegmentProgress,
  withFitMaxZoom,
} from "./creditHistoryGraph.utils";

const ROW_HEIGHT = 56;
const INDENT = 40;
const TRUNK_OFFSET = 30;
const ROOT_X = 70;
const BRANCH_OFFSET = 17;
const JOINT_GAP = 7;
// Matches the <ReactFlow maxZoom> below — restored after a fit's zoom cap.
const DEFAULT_MAX_ZOOM = 3;

// Per-level stagger of the path-highlight cascade, so it "flows" down the
// path rather than snapping to blue at once.
const PATH_STAGGER_MS = 90;
const PATH_TRANSITION_MS = 260;
const PATH_TRANSITION = `background-color ${PATH_TRANSITION_MS}ms ease, border-color ${PATH_TRANSITION_MS}ms ease, color ${PATH_TRANSITION_MS}ms ease, box-shadow ${PATH_TRANSITION_MS}ms ease`;

interface TimelineEdgeData {
  trunkX: number;
  sourceRowY: number;
  /** The child/target node's depth — an edge's highlight delay matches the
   * moment its target's row is due to light up (see `PATH_STAGGER_MS`). */
  targetDepth: number;
}

/** Trunk-and-branch layout: each node on its own row, indented from its
 * parent; edges originate from a trunk point offset left of the node. */
const layoutTimeline = (root: HistoryTreeNode, collapsed: Set<string>): GraphLayout => {
  const nodes: LaidOutNode[] = [];
  const edges: (GraphLayout["edges"][number] & { data: TimelineEdgeData })[] = [];
  let row = 0;
  let maxX = 0;

  const walk = (node: HistoryTreeNode, x: number) => {
    const y = row * ROW_HEIGHT;
    row += 1;
    const width = Math.max(120, node.label.length * 7.5 + 40);
    nodes.push({ ...node, x, y, width, height: 34 });
    maxX = Math.max(maxX, x + width);
    const trunkX = x - TRUNK_OFFSET;
    effectiveChildren(node, collapsed).forEach((child) => {
      edges.push({
        id: `${node.id}-${child.id}`,
        sourceId: node.id,
        targetId: child.id,
        data: { trunkX, sourceRowY: y, targetDepth: child.depth },
      });
      walk(child, x + INDENT);
    });
  };
  walk(root, ROOT_X);

  return { nodes, edges, width: maxX + 40, height: row * ROW_HEIGHT };
};

interface NoteTextProps {
  /** The note up to the company name (the `nodes` mapping splits it out). */
  notePrefix?: string;
  /** Company named in the note — linked to its profile when `companyId` known. */
  companyName?: string;
  companyId?: number | null;
  updateTime?: string;
  /** "Credit #N" marker chip, trailing the note line. */
  creditMarker?: string;
}

const NoteText = ({ notePrefix, companyName, companyId, updateTime, creditMarker }: NoteTextProps) => {
  const navigate = useNavigate();
  if (!notePrefix && !companyName && !creditMarker) return null;
  return (
    <span
      style={{
        position: "absolute",
        left: "calc(100% + 14px)",
        top: "50%",
        transform: "translateY(-50%)",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        whiteSpace: "nowrap",
        fontSize: 13,
        fontWeight: 400,
        color: "#64748b",
      }}
    >
      <span>
        {notePrefix}
        {companyName &&
          (companyId != null ? (
            <a
              className="nodrag nopan chg-note-company-link"
              onClick={(e) => {
                // Don't let the link click also select the node.
                e.stopPropagation();
                navigate(ROUTES.VIEW_ORGANIZATION_PROFILE, { state: { record: { companyId } } });
              }}
            >
              {companyName}
            </a>
          ) : (
            companyName
          ))}
        {updateTime && ` | ${updateTime}`}
      </span>
      {creditMarker && <span className="chg-credit-marker">{creditMarker}</span>}
    </span>
  );
};

interface TimelineNodeData {
  range: string;
  /** Only for on-path nodes; the `nodes` mapping splits the note for linking. */
  notePrefix?: string;
  companyName?: string;
  companyId?: number | null;
  updateTime?: string;
  isItmo?: boolean;
  /** Only on the selected node — see `creditMarkerLabel` in GraphViewProps. */
  creditMarker?: string;
  hasChildren: boolean;
  collapsed: boolean;
  onPath: boolean;
  selected: boolean;
  /** depth × `PATH_STAGGER_MS` — delays this node's highlight so it cascades. */
  pathDelayMs: number;
  /** When false, `onClick` is a no-op and the cursor stays default. */
  interactiveSelection: boolean;
  onClick: () => void;
  onToggle: (e: React.MouseEvent) => void;
}

/** Every non-root node: a pill fed by an incoming branch, with its own
 * collapse/expand toggle sitting on that branch's trunk. */
const TimelineNode = ({ data }: { data: TimelineNodeData }) => {
  const {
    range,
    notePrefix,
    companyName,
    companyId,
    updateTime,
    isItmo,
    creditMarker,
    hasChildren,
    collapsed,
    onPath,
    selected,
    pathDelayMs,
    interactiveSelection,
    onClick,
    onToggle,
  } = data;

  const { background, color, borderColor, accentBorderLeft } = getNodeColors({ selected, onPath, isItmo });

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        // React Flow disables pointer events on nodes unless drag/select props
        // are set (we don't); re-enable so our own click handling works.
        pointerEvents: "auto",
        padding: "1px 14px",
        borderRadius: 8,
        border: `${selected ? 2 : 1.4}px solid ${borderColor}`,
        ...(accentBorderLeft ? { borderLeft: accentBorderLeft } : {}),
        background,
        color,
        fontSize: 13,
        fontWeight: onPath ? 600 : 500,
        cursor: interactiveSelection ? "pointer" : "default",
        whiteSpace: "nowrap",
        boxShadow: selected ? (isItmo ? "0 0 0 4px rgba(124,58,237,0.15)" : "0 0 0 4px rgba(24,144,255,0.15)") : "none",
        transition: PATH_TRANSITION,
        // Delay only while *becoming* on-path (the cascade); clear instantly
        // when leaving the path so it doesn't linger past the new selection.
        transitionDelay: onPath ? `${pathDelayMs}ms` : "0ms",
      }}
    >
      <NoteText
        notePrefix={notePrefix}
        companyName={companyName}
        companyId={companyId}
        updateTime={updateTime}
        creditMarker={creditMarker}
      />
      <Handle type="target" position={Position.Left} style={{ visibility: "hidden" }} />
      {range}
      <Handle type="source" position={Position.Right} style={{ visibility: "hidden" }} />
      {hasChildren && (
        // Sits on this node's own trunk line, not on its corner.
        <button
          className="nodrag nopan"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(e);
          }}
          style={{
            position: "absolute",
            left: -50,
            top: "50%",
            transform: "translateY(-50%)",
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: `1.3px solid ${collapsed ? isItmo? ITMO_VIOLET_700  :  "#0b6dc7" : "#94a3b8"}`,
            background: collapsed ? isItmo? ITMO_VIOLET_500  :  "#1890ff" : "#fff",
            color: collapsed ? "#fff" : "#64748b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
            zIndex: 1,
          }}
        >
          {collapsed ? <Icon.Plus size={10} /> : <Icon.Dash size={10} />}
        </button>
      )}
    </div>
  );
};

interface RootNodeData {
  range: string;
  notePrefix?: string;
  companyName?: string;
  companyId?: number | null;
  updateTime?: string;
  /** Only set when the root itself is the selected node — see
   * `creditMarkerLabel` in GraphViewProps. */
  creditMarker?: string;
  selected: boolean;
  interactiveSelection: boolean;
  onClick: () => void;
}

/** Root is its own node type — no incoming branch, never collapses, always
 * styled as the start of the path; none of TimelineNode's toggle plumbing. */
const RootNode = ({ data }: { data: RootNodeData }) => {
  const {
    range,
    notePrefix,
    companyName,
    companyId,
    updateTime,
    creditMarker,
    selected,
    interactiveSelection,
    onClick,
  } = data;

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        pointerEvents: "auto",
        padding: "1px 14px",
        borderRadius: 8,
        border: `${selected ? 2 : 1.4}px solid ${selected ? "#0b6dc7" : "#1890ff"}`,
        background: selected ? "#1890ff" : "#e6f4ff",
        color: selected ? "#fff" : "#12172b",
        fontSize: 13,
        fontWeight: 700,
        cursor: interactiveSelection ? "pointer" : "default",
        whiteSpace: "nowrap",
        boxShadow: selected ? "0 0 0 4px rgba(24,144,255,0.15)" : "none",
        // Root is always depth 0 — the path-highlight cascade (see
        // `PATH_STAGGER_MS` on TimelineNode) starts here, so no delay.
        transition: PATH_TRANSITION,
      }}
    >
      <NoteText
        notePrefix={notePrefix}
        companyName={companyName}
        companyId={companyId}
        updateTime={updateTime}
        creditMarker={creditMarker}
      />
      {range}
      <Handle type="source" position={Position.Right} style={{ visibility: "hidden" }} />
    </div>
  );
};

// Straight-line trunk-and-branch path: down the parent's trunk to this
// child's row, then across to the child (hard right angles, no curve).
// Siblings redraw the shared vertical segment identically, reading as one
// continuous trunk with branches peeling off it.
const TimelineEdge = ({ targetX, targetY, style, markerEnd, data }: EdgeProps<TimelineEdgeData>) => {
  const { trunkX, sourceRowY } = data!;
  const path = `M ${trunkX },${sourceRowY + BRANCH_OFFSET} L ${trunkX},${targetY} L ${targetX - 4},${targetY}`;
  return <path d={path} fill="none" style={style} markerEnd={markerEnd} className="react-flow__edge-path" />;
};

const nodeTypes = { timelineNode: TimelineNode, rootNode: RootNode };
const edgeTypes = { timelineEdge: TimelineEdge };

/**
 * Trunk-and-branch view — each node on its own row; connections run down a
 * vertical trunk then branch across. Self-contained (layout + rendering).
 */
export const TimelineGraphView = ({
  root,
  collapsed,
  selectedId,
  pathIds,
  interactiveSelection,
  showCollapseToggle,
  fitScope,
  isDefaultStateReady,
  creditMarkerLabel,
  maxZoom,
  onSelectNode,
  onToggleCollapse,
}: GraphViewProps) => {
  const { getNodes, fitBounds } = useReactFlow();
  const storeApi = useStoreApi();
  const nodesInitialized = useNodesInitialized();

  const layout = useMemo(() => layoutTimeline(root, collapsed), [root, collapsed]);

  // The root is drawn flush at x=0 and content-sized, so the layout's width
  // estimate can't centre its trunk — read the *measured* width back from
  // React Flow instead. Null until measured (edges use the estimate briefly).
  const [rootTrunkX, setRootTrunkX] = useState<number | null>(null);

  useEffect(() => {
    if (!nodesInitialized) return;
    let rafId: number;
    let attempts = 0;
    const measure = () => {
      attempts += 1;
      const rootNode = getNodes().find((n) => n.type === "rootNode");
      if (rootNode?.width) {
        setRootTrunkX(rootNode.position.x + rootNode.width / 2);
      } else if (attempts < 60) {
        // Poll (~1s cap) until the width is measured.
        rafId = requestAnimationFrame(measure);
      }
    };
    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, [nodesInitialized, layout, getNodes]);

  // Progress (0→1) of the ordered edge-by-edge path reveal; plain state (not
  // CSS) so edges light strictly in sequence, not all at once.
  const [pathAnimProgress, setPathAnimProgress] = useState(1);
  // Seeded with the current selectedId (not null) so a Timeline/Binary remount
  // with an unchanged selection doesn't replay the reveal — only a genuine
  // selection change during this mount animates.
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
  // are also rendered (uncollapsed) — include them so the path-only fit covers
  // them too instead of clipping them.
  const initialFitIds = useMemo(() => {
    if (!pathIds.size || !selectedId) return pathIds;
    const ids = new Set(pathIds);
    layout.nodes.forEach((n) => {
      if (n.parent?.id === selectedId) ids.add(n.id);
    });
    return ids;
  }, [layout, pathIds, selectedId]);

  const nodes: (Node<TimelineNodeData> | Node<RootNodeData>)[] = useMemo(
    () =>
      layout.nodes.map((n) => {
        const range = n.range;
        const noteText = n.note && n.note.trim() ? n.note.trim() : undefined;
        const companyNameRaw = n.companyName && n.companyName.trim() ? n.companyName.trim() : undefined;
        // The company name is the note's suffix (see `formatActionNote`) —
        // split it out so it can be a link; fall back to plain text otherwise.
        const hasCompanySuffix = !!(companyNameRaw && noteText && noteText.endsWith(companyNameRaw));
        const notePrefix = hasCompanySuffix ? noteText!.slice(0, noteText!.length - companyNameRaw!.length) : noteText;
        const companyName = hasCompanySuffix ? companyNameRaw : undefined;
        const companyId = hasCompanySuffix ? n.companyId : undefined;
        const updateTime = notePrefix || companyName ? n.updateTime : undefined;
        const selected = n.id === selectedId;
        const creditMarker = selected ? creditMarkerLabel : undefined;
        const onClick = interactiveSelection ? () => onSelectNode(n.id) : () => {};

        if (n.depth === 0) {
          // Root draws flush at x=0; the layout still anchors it at ROOT_X so
          // its trunk and children indent correctly, subtracted back out here.
          const node: Node<RootNodeData> = {
            id: n.id,
            type: "rootNode",
            position: { x: n.x - ROOT_X, y: n.y },
            draggable: false,
            data: {
              range,
              notePrefix,
              companyName,
              companyId,
              updateTime,
              creditMarker,
              selected,
              interactiveSelection,
              onClick,
            },
          };
          return node;
        }

        const node: Node<TimelineNodeData> = {
          id: n.id,
          type: "timelineNode",
          position: { x: n.x + JOINT_GAP, y: n.y },
          draggable: false,
          data: {
            range,
            notePrefix,
            companyName,
            companyId,
            updateTime,
            isItmo: n.isItmo,
            creditMarker,
            hasChildren: showCollapseToggle && n.children.length > 0,
            collapsed: collapsed.has(n.id),
            onPath: pathIds.has(n.id),
            selected,
            pathDelayMs: n.depth * PATH_STAGGER_MS,
            interactiveSelection,
            onClick,
            onToggle: () => onToggleCollapse(n.id),
          },
        };
        return node;
      }),
    [
      layout,
      collapsed,
      pathIds,
      selectedId,
      interactiveSelection,
      showCollapseToggle,
      creditMarkerLabel,
      onSelectNode,
      onToggleCollapse,
    ]
  );

  // Per-edge ITMO lookup, so the path highlight can turn violet on the
  // segments leading into an ITMO node instead of the default blue.
  const isItmoById = useMemo(() => {
    const map = new Map<string, boolean>();
    layout.nodes.forEach((n) => map.set(n.id, !!n.isItmo));
    return map;
  }, [layout]);

  const edges: Edge<TimelineEdgeData>[] = useMemo(
    () =>
      (layout.edges as (GraphLayout["edges"][number] & { data: TimelineEdgeData })[])
        .map((e) => {
          const onPath = pathIds.has(e.sourceId) && pathIds.has(e.targetId);
          // targetDepth - 1 → 0-based segment index in the root→selected chain.
          const alpha = onPath ? pathSegmentProgress(e.data.targetDepth - 1, pathTotalSegments, pathAnimProgress) : 0;
          // An edge represents the action that produced its target, so it's
          // "ITMO" when the target is - e.g. the edge into an ITMO_AUTH node,
          // or into a later RETIRE/TRANSFER of already-authorized credits.
          const targetIsItmo = isItmoById.get(e.targetId) ?? false;
          const pathColor = targetIsItmo ? ITMO_VIOLET_500 : "#1890ff";
          const glowRgb = targetIsItmo ? "139, 92, 246" : "24, 144, 255";
          const stroke = onPath ? mixHexColor("#aab1bd", pathColor, alpha) : "#aab1bd";
          // Recentre the root's trunk on its measured width once known (see
          // `rootTrunkX`); every other node keeps its layout gutter trunk.
          const data =
            rootTrunkX != null && e.sourceId === root.id ? { ...e.data, trunkX: rootTrunkX } : e.data;
          return {
            id: e.id,
            source: e.sourceId,
            target: e.targetId,
            type: "timelineEdge",
            data,
            onPath,
            style: {
              stroke,
              strokeWidth: onPath ? 1.4 + (2.6 - 1.4) * alpha : 1.4,
              // Glow that fades in with the segment (same alpha as color/width).
              filter: onPath ? `drop-shadow(0 0 3px rgba(${glowRgb}, ${(0.65 * alpha).toFixed(2)}))` : "none",
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: stroke,
              width: 10,
              height: 10,
            },
          };
        })
        // SVG paints in order — sort on-path edges last so they stay on top.
        .sort((a, b) => Number(a.onPath) - Number(b.onPath)),
    [layout, pathIds, isItmoById, pathTotalSegments, pathAnimProgress, rootTrunkX, root.id]
  );

  // Fits on mount and every layout change, via our own fitGraphToScreen (not
  // fitView, which misses overflowing notes and the toolbar). Gated on
  // `isDefaultStateReady` so it doesn't fit the transient pre-default tree, and
  // polls `areNodesMeasured` since `useNodesInitialized()` can flip true a
  // frame before widths are real.
  useEffect(() => {
    if (!nodesInitialized || !isDefaultStateReady) return;
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
          getExtraRight: (n) =>
            measureNoteWidth(
              `${n.data?.creditMarker ? `${n.data.creditMarker}    ` : ""}${n.data?.notePrefix ?? ""}${n.data?.companyName ?? ""}${n.data?.updateTime ? ` | ${n.data.updateTime}` : ""}`
            ),
          // Headroom so the fit doesn't tuck the top node under the floating
          // mode-toggle — needed regardless of fit scope.
          extraTop: FIT_EXTRA_TOP,
          filter: useScope ? (n) => initialFitIds.has(n.id) : undefined,
        }
      );
    };
    rafId = requestAnimationFrame(tryFit);
    return () => cancelAnimationFrame(rafId);
  }, [nodesInitialized, isDefaultStateReady, layout, getNodes, fitBounds, fitScope, initialFitIds, maxZoom, storeApi]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
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
