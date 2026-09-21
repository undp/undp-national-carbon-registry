import { Modal, Spin, message } from 'antd';
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from 'react';
import moment from 'moment';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { API_PATHS } from '../../Config/apiConfig';
import CadTrustLogo from '../../Assets/Images/cadtrust-logo.png';
import {
  CADTRUST_TABLE_NAMES,
  CadTrustLocalEntityType,
  CadTrustSyncOverallStatus,
  CadTrustSyncOverview,
  CadTrustSyncRecordView,
  CadTrustSyncScope,
  CadTrustSyncStatus,
  CREDIT_ENTITY_ORDER,
  ENTITY_TYPE_LABELS,
  PROJECT_ENTITY_ORDER,
  PROJECT_SETUP_ENTITY_TYPES,
  SECTION_LABEL_FIELDS,
  SETUP_ID_PREFIXES,
} from './cadTrustSync.types';
import './cadTrustSync.scss';

export interface CadTrustSyncModalProps {
  open: boolean;
  onClose: () => void;
  scope: CadTrustSyncScope;
  refId?: string;
  creditBlockId?: string;
  /** Human label for the header chip — project name or credit serial number. */
  title?: string;
}

const OVERALL_TEXT: Record<CadTrustSyncOverallStatus, string> = {
  SYNCED: 'Synced to CAD Trust',
  IN_PROGRESS: 'Sync in progress',
  FAILED: 'Sync failed',
  NONE: 'Not synced',
};

const OVERALL_COLOR: Record<CadTrustSyncOverallStatus, string> = {
  SYNCED: '#5dc380',
  IN_PROGRESS: '#16b1ff',
  FAILED: '#ff4d4f',
  NONE: 'rgba(58,53,65,.35)',
};

const PILL_MOD: Record<CadTrustSyncStatus, string> = {
  COMMITTED: 'committed',
  STAGED: 'staged',
  PENDING: 'pending',
  FAILED: 'failed',
};

const RELATIONSHIP_TYPES: CadTrustLocalEntityType[] = [
  'PROJECT_METHODOLOGY',
  'STAKEHOLDER_PROJECT',
  'UNIT_LABEL',
];

const ACCENT_ICON_TYPES: CadTrustLocalEntityType[] = ['PROJECT', 'UNIT'];

const svgProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const EntityIcon = ({ type, size = 16 }: { type: CadTrustLocalEntityType; size?: number }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', ...svgProps };
  switch (type) {
    case 'ORGANIZATION':
    case 'STAKEHOLDER':
      return (
        <svg {...p}>
          <path d="M4 21V9l8-5 8 5v12" />
          <path d="M9 21v-5h6v5" />
          <path d="M9 12h.01M15 12h.01" />
        </svg>
      );
    case 'PROGRAM':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.4 2.3 3.7 5.6 3.7 9S14.4 18.7 12 21c-2.4-2.3-3.7-5.6-3.7-9S9.6 5.3 12 3Z" />
        </svg>
      );
    case 'METHODOLOGY':
      return (
        <svg {...p}>
          <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3" />
          <path d="M7 15h10" />
        </svg>
      );
    case 'PROJECT':
      return (
        <svg {...p}>
          <path d="M12 3 3 8l9 5 9-5-9-5Z" />
          <path d="m3 13 9 5 9-5" />
        </svg>
      );
    case 'LOCATION':
      return (
        <svg {...p}>
          <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case 'VALIDATION':
      return (
        <svg {...p}>
          <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
          <path d="m9.5 12 1.8 1.8L15 10" />
        </svg>
      );
    case 'VERIFICATION':
      return (
        <svg {...p}>
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
          <path d="m9 13 2 2 4-4" />
        </svg>
      );
    case 'ISSUANCE':
      return (
        <svg {...p}>
          <circle cx="12" cy="9" r="5" />
          <path d="m8.5 13-2 8 5.5-3 5.5 3-2-8" />
        </svg>
      );
    case 'UNIT':
      return (
        <svg {...p}>
          <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
          <path d="M4 7l8 4 8-4M12 21V11" />
        </svg>
      );
    case 'LABEL':
      return (
        <svg {...p}>
          <path d="M20.6 13.4 12 22l-8-8V4h10l6.6 6.6a2 2 0 0 1 0 2.8Z" />
          <circle cx="8.5" cy="8.5" r="1.5" />
        </svg>
      );
    default:
      // relationship links
      return (
        <svg {...p}>
          <path d="M9 12h6" />
          <path d="M8 7a5 5 0 0 0 0 10h1" />
          <path d="M16 7a5 5 0 0 1 0 10h-1" />
        </svg>
      );
  }
};

const CopyIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...svgProps} strokeWidth={1.8}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
);

const CheckIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...svgProps} strokeWidth={2.2}>
    <path d="m5 12 5 5L20 7" />
  </svg>
);

const StatusPill = ({ status }: { status: CadTrustSyncStatus }) => (
  <span className={`cadtrust-sync-pill cadtrust-sync-pill--${PILL_MOD[status]}`}>
    <span className="cadtrust-sync-pill__dot" />
    {status.charAt(0) + status.slice(1).toLowerCase()}
  </span>
);

/** Clipboard button that flips to a check for ~1.5s after a successful copy. */
const CopyButton = ({ value }: { value?: string }) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!value) return null;

  const copy = (e: MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard?.writeText(value);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <button type="button" className="cadtrust-sync-copy" onClick={copy} title="Copy ID">
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
};

const IdRow = ({ text, value }: { text: string; value?: string }) => (
  <span className="cadtrust-sync-uuid">
    <span className="cadtrust-sync-uuid__text">{text}</span>
    <CopyButton value={value} />
  </span>
);

const formatDateTime = (value?: number) => {
  if (!value) return '—';
  return moment(Number(value)).format('DD MMM YYYY, HH:mm');
};

const flattenPayload = (payload: Record<string, unknown>): Array<[string, string]> => {
  if (!payload || typeof payload !== 'object') return [];
  return Object.entries(payload).map(([key, raw]) => {
    if (raw === null || raw === undefined || raw === '') return [key, '—'];
    if (typeof raw === 'object') {
      try {
        return [key, JSON.stringify(raw)];
      } catch {
        return [key, String(raw)];
      }
    }
    return [key, String(raw)];
  });
};

const deriveSectionLabel = (
  type: CadTrustLocalEntityType,
  record: CadTrustSyncRecordView
): string => {
  const payload = record.payload ?? {};
  for (const key of SECTION_LABEL_FIELDS[type] ?? []) {
    const val = payload[key];
    if (typeof val === 'string' && val.trim()) return val;
  }
  return record.localId;
};

const DataDisclosure = ({ payload }: { payload: Record<string, unknown> }) => {
  const rows = useMemo(() => flattenPayload(payload), [payload]);
  const [open, setOpen] = useState(false);

  if (rows.length === 0) return null;

  return (
    <div className="cadtrust-sync-data">
      <button
        type="button"
        className={`cadtrust-sync-data__toggle${open ? ' is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="chev">
          <svg width="11" height="11" viewBox="0 0 24 24" {...svgProps} strokeWidth={2.4}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
        {open ? 'Hide table data' : 'Show table data'}
      </button>
      {open && (
        <div className="cadtrust-sync-data__grid">
          <div className="cadtrust-sync-data__head">Column key</div>
          <div className="cadtrust-sync-data__head">Data value</div>
          {rows.map(([key, value]) => (
            <Fragment key={key}>
              <div className="cadtrust-sync-data__key">{key}</div>
              <div className="cadtrust-sync-data__val">{value}</div>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

const EntityCard = ({
  type,
  records,
}: {
  type: CadTrustLocalEntityType;
  records: CadTrustSyncRecordView[];
}) => {
  if (records.length === 0) return null;

  const subtitle = RELATIONSHIP_TYPES.includes(type)
    ? 'Link record'
    : records.length > 1
      ? `${records.length} records`
      : records[0].localId;

  return (
    <div className="cadtrust-sync-card">
      <div className="cadtrust-sync-card__head">
        <span
          className={`cadtrust-sync-ico${
            ACCENT_ICON_TYPES.includes(type) ? ' cadtrust-sync-ico--accent' : ''
          }`}
        >
          <EntityIcon type={type} />
        </span>
        <span className="cadtrust-sync-card__titles">
          <span className="cadtrust-sync-card__name">{ENTITY_TYPE_LABELS[type]}</span>
          <span className="cadtrust-sync-card__sub">{subtitle}</span>
        </span>
        <span className="cadtrust-sync-card__table">{CADTRUST_TABLE_NAMES[type]}</span>
      </div>

      <div className="cadtrust-sync-card__sections">
        {records.map((record, i) => (
          <div className="cadtrust-sync-section" key={`${record.localId}-${i}`}>
            <div className="cadtrust-sync-section__top">
              <span className="cadtrust-sync-section__id">
                <span className="cadtrust-sync-section__label">
                  {deriveSectionLabel(type, record)}
                </span>
                {record.cadTrustId && (
                  <IdRow text={record.cadTrustId} value={record.cadTrustId} />
                )}
              </span>
              <StatusPill status={record.syncStatus} />
            </div>

            <div className="cadtrust-sync-section__meta">
              <span>
                {record.attemptCount} attempt{record.attemptCount === 1 ? '' : 's'}
              </span>
              <span>Updated {formatDateTime(record.updateTime)}</span>
            </div>

            {record.lastError && (
              <div className="cadtrust-sync-section__error">
                <svg width="15" height="15" viewBox="0 0 24 24" {...svgProps} strokeWidth={1.8}>
                  <path d="M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                </svg>
                <span>{record.lastError}</span>
              </div>
            )}

            {record.payload && <DataDisclosure payload={record.payload} />}
          </div>
        ))}
      </div>
    </div>
  );
};

const SetupRow = ({
  type,
  record,
}: {
  type: CadTrustLocalEntityType;
  record: CadTrustSyncRecordView;
}) => {
  const id = record.cadTrustId ?? record.localId;
  const prefix = SETUP_ID_PREFIXES[type];
  return (
    <div className="cadtrust-sync-setup-row">
      <span className="cadtrust-sync-ico cadtrust-sync-ico--sm">
        <EntityIcon type={type} size={15} />
      </span>
      <span className="cadtrust-sync-setup-row__body">
        <span className="cadtrust-sync-setup-row__name">{ENTITY_TYPE_LABELS[type]}</span>
        <IdRow text={prefix ? `${prefix} · ${id}` : id} value={id} />
      </span>
      <StatusPill status={record.syncStatus} />
    </div>
  );
};

export const CadTrustSyncModal = ({
  open,
  onClose,
  scope,
  refId,
  creditBlockId,
  title,
}: CadTrustSyncModalProps) => {
  const { get } = useConnection();
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<CadTrustSyncOverview>();

  const identityId = scope === 'project' ? refId : creditBlockId;

  useEffect(() => {
    if (!open) return;
    if (!identityId) {
      setOverview({ overallStatus: 'NONE', records: [] });
      return;
    }
    const path =
      scope === 'project'
        ? API_PATHS.CADTRUST_SYNC_PROJECT_OVERVIEW(identityId)
        : API_PATHS.CADTRUST_SYNC_CREDIT_OVERVIEW(identityId);

    let cancelled = false;
    setLoading(true);
    setOverview(undefined);
    (get(path) as Promise<{ data?: CadTrustSyncOverview }>)
      .then((response) => {
        if (cancelled) return;
        setOverview(response.data ?? { overallStatus: 'NONE', records: [] });
      })
      .catch((error: { message?: string }) => {
        if (cancelled) return;
        message.error(error.message ?? 'Unable to load CAD Trust sync details');
        setOverview({ overallStatus: 'NONE', records: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, scope, identityId, get]);

  const grouped = useMemo(() => {
    return (overview?.records ?? []).reduce<
      Partial<Record<CadTrustLocalEntityType, CadTrustSyncRecordView[]>>
    >((acc, record) => {
      (acc[record.localEntityType] ??= []).push(record);
      return acc;
    }, {});
  }, [overview]);

  const summary = useMemo(() => {
    const records = overview?.records ?? [];
    const committed = records.filter((r) => r.syncStatus === 'COMMITTED').length;
    const failed = records.filter((r) => r.syncStatus === 'FAILED').length;
    return {
      total: records.length,
      committed,
      failed,
      awaiting: Math.max(0, records.length - committed - failed),
      lastActivity: records.reduce((max, r) => Math.max(max, r.updateTime || 0), 0),
    };
  }, [overview]);

  const overallStatus = overview?.overallStatus ?? 'NONE';
  const accent = OVERALL_COLOR[overallStatus];

  const bannerSub = (() => {
    if (overallStatus === 'SYNCED') return `All ${summary.total} records published`;
    if (overallStatus === 'FAILED')
      return `${summary.failed} of ${summary.total} records need attention`;
    return `${summary.committed} published · ${summary.awaiting} awaiting the next commit`;
  })();

  const setupTypes =
    scope === 'project'
      ? PROJECT_SETUP_ENTITY_TYPES.filter((t) => (grouped[t] ?? []).length > 0)
      : [];
  const recordTypes = (scope === 'project' ? PROJECT_ENTITY_ORDER : CREDIT_ENTITY_ORDER).filter(
    (t) => !setupTypes.includes(t)
  );

  const chip =
    scope === 'project'
      ? [title, identityId].filter(Boolean).join(' · ')
      : title || identityId;

  const head = (
    <div className="cadtrust-sync-modal__head">
      <span className="cadtrust-sync-modal__logo">
        <img src={CadTrustLogo} alt="CAD Trust" />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="cadtrust-sync-modal__title" style={{ display: 'block' }}>
          CAD Trust Sync
        </span>
        <span className="cadtrust-sync-modal__subtitle">
          {scope === 'project' ? 'Project' : 'Credit block'}
          {chip && <span className="cadtrust-sync-modal__chip">{chip}</span>}
        </span>
      </span>
    </div>
  );

  return (
    <Modal
      title={head}
      open={open}
      onCancel={onClose}
      footer={null}
      width={Math.min(720, window.innerWidth - 32)}
      centered
      destroyOnClose
      className="cadtrust-sync-modal"
    >
      {loading ? (
        <div className="cadtrust-sync-state">
          <Spin />
        </div>
      ) : !overview || overview.records.length === 0 ? (
        <div className="cadtrust-sync-state cadtrust-sync-empty">
          <div className="cadtrust-sync-empty__ico">
            <svg width="20" height="20" viewBox="0 0 24 24" {...svgProps} strokeWidth={1.6}>
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18" />
              <path d="M12 3c2.6 2.4 4 5.8 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.8-4-9s1.4-6.6 4-9Z" />
            </svg>
          </div>
          <div className="cadtrust-sync-empty__title">Not synced to CAD Trust yet</div>
          <div className="cadtrust-sync-empty__sub">
            Records appear here once this{' '}
            {scope === 'project' ? 'project' : 'credit block'} has been sent to the node.
          </div>
        </div>
      ) : (
        <>
          <div
            className={`cadtrust-sync-banner${
              overallStatus === 'FAILED' ? ' cadtrust-sync-banner--failed' : ''
            }`}
          >
            <div className="cadtrust-sync-banner__lead">
              <span
                className="cadtrust-sync-banner__dot"
                style={{ background: accent, boxShadow: `0 0 0 4px ${accent}28` }}
              />
              <div>
                <div className="cadtrust-sync-banner__status">{OVERALL_TEXT[overallStatus]}</div>
                <div className="cadtrust-sync-banner__sub">{bannerSub}</div>
              </div>
            </div>
            <div className="cadtrust-sync-banner__stats">
              <div className="cadtrust-sync-banner__stat">
                <div className="num">{summary.total}</div>
                <div className="cap">Records</div>
              </div>
              <div className="cadtrust-sync-banner__stat">
                <div className="num num--ok">{summary.committed}</div>
                <div className="cap">Committed</div>
              </div>
              <div className="cadtrust-sync-banner__stat">
                <div className={`num${summary.failed ? '' : ' num--muted'}`}>{summary.failed}</div>
                <div className="cap">Failed</div>
              </div>
              <div className="cadtrust-sync-banner__stat">
                <div className="num num--nowrap">{formatDateTime(summary.lastActivity)}</div>
                <div className="cap">Updated</div>
              </div>
            </div>
          </div>

          <div className="cadtrust-sync-modal__note">
            Records are staged privately on this registry&apos;s CAD Trust node and go public on the
            next commit. <b>Committed</b> = published; <b>Staged / Pending</b> = not yet published;{' '}
            <b>Failed</b> = last attempt errored.
          </div>

          {setupTypes.length > 0 && (
            <>
              <div className="cadtrust-sync-modal__group-label">Registry setup</div>
              <div className="cadtrust-sync-setup">
                {setupTypes.map((type) =>
                  (grouped[type] ?? []).map((record, i) => (
                    <SetupRow key={`${type}-${i}`} type={type} record={record} />
                  ))
                )}
              </div>
            </>
          )}

          <div className="cadtrust-sync-modal__group-label">
            {scope === 'project' ? 'Project records' : 'Related records'}
          </div>
          <div className="cadtrust-sync-modal__records">
            {recordTypes.map((type) => (
              <EntityCard key={type} type={type} records={grouped[type] ?? []} />
            ))}
          </div>
        </>
      )}
    </Modal>
  );
};
