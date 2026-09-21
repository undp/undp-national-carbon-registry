// One structured action from getCreditBlockHistoryTree (POST
// /national/creditTransactionsManagement/creditBlockHistory).
export interface CreditBlockHistoryActionInfo {
  companyId: number | null;
  companyName: string | null;
  /** Raw epoch ms — format client-side (in the viewer's local timezone)
   * rather than trusting a server-baked string. */
  timestamp: number;
  /** Size of this leaf's own range (end - start + 1), not the parent block. */
  amount: number;
  action: "ISSUE" | "RETAIN" | "TRANSFER" | "RETIRE" | "ITMO_AUTH";
  /** Whether these credits were ITMO-authorized as at this action — set on
   * every action, not just ITMO_AUTH, since a later RETIRE/TRANSFER/RETAIN
   * of already-authorized credits is still ITMO. */
  isItmo?: boolean;
  /** Dec 6/CMA.4 Annex I para 5 identifier, covering exactly this node's range. */
  itmoSerial?: string | null;
  /** ITMO_AUTH only — the purpose the credits were authorized for. */
  authorizationPurpose?: string | null;
  /** RETIRE only — which Article 6 use the retirement was made for. */
  retireSubType?: string | null;
}

export interface CreditHistoryEntry {
  /** Serial-number sub-range, e.g. "601-1000". */
  range: string;
  /** Only on the issuance root; every other entry describes itself via `children`. */
  info?: CreditBlockHistoryActionInfo;
  /** One item for a whole-block transition, two for a split (RETAIN + TRANSFER/RETIRE). */
  children?: { range: string; info: CreditBlockHistoryActionInfo }[];
}

export interface HistoryTreeNode {
  id: string;
  range: string;
  /** Display text from `info.action` (see `formatActionNote`); doesn't repeat
   * the range. Empty for a split's own "pre-split" node. */
  note?: string;
  /** `info.timestamp`. Empty for a split's "pre-split" node, like `note`. */
  updateTime?: string;
  /** `info` company of the action — the name in `note`, so a view can link it
   * without re-parsing. Empty for a split's "pre-split" node. */
  companyId?: number | null;
  companyName?: string | null;
  /** `info.isItmo`/`itmoSerial`/`retireSubType` — drive node coloring (both
   * views) and the Binary Tree detail panel. Empty for a split's "pre-split"
   * node, like `note`. */
  isItmo?: boolean;
  itmoSerial?: string | null;
  retireSubType?: string | null;
  label: string;
  depth: number;
  children: HistoryTreeNode[];
  parent: HistoryTreeNode | null;
}

export type GraphMode = "timeline" | "binary";

export interface LaidOutNode extends HistoryTreeNode {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GraphLayout {
  nodes: LaidOutNode[];
  edges: { id: string; sourceId: string; targetId: string }[];
  width: number;
  height: number;
}

// Shared inputs both graph views (Timeline, Binary Tree) are driven by.
// Tree-building and selection/collapse state live in CreditHistoryGraph; each
// view only owns its own layout and node/edge presentation.
export interface GraphViewProps {
  root: HistoryTreeNode;
  collapsed: Set<string>;
  selectedId: string | null;
  pathIds: Set<string>;
  interactiveSelection: boolean;
  /** Whether nodes render their +/- expand/collapse toggle. */
  showCollapseToggle: boolean;
  /**
   * Scope of the *next* fit-to-screen. "path" while the graph still shows its
   * untouched default state (mount / right after "Reset view"); flips to "all"
   * on the first expand/collapse or selection.
   * - "all": fit every visible node.
   * - "path": fit only the traced path's nodes — for views (Explorer) whose
   *   tree also holds collapsed off-path branch points.
   */
  fitScope: "all" | "path";
  /**
   * True once GraphShell's default-selection effect has run. The first paint
   * is untouched initial state (empty `collapsed`, null `selectedId`); gating
   * the initial fit on this avoids fitting to that transient tree.
   */
  isDefaultStateReady: boolean;
  /** "Nth Credit" marker text for the *selected* node — set when the graph was
   * opened from a single-unit serial search (see Explorer). */
  creditMarkerLabel?: string;
  /** Caps how far "Fit to screen" zooms in (see `fitGraphToScreen`) — set by
   * the fullscreen tab so a small tree isn't oversized; unset when inline. */
  maxZoom?: number;
  /** IDs of nodes currently showing their expanded detail panel (Binary Tree's
   * per-node eye toggle). Unused by Timeline, which has no such panel. */
  expandedDetailIds: Set<string>;
  onSelectNode: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  /** Toggles a single node's entry in `expandedDetailIds`. */
  onToggleNodeDetail: (id: string) => void;
}
