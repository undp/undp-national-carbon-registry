import { useState, type MouseEvent } from 'react';
import { Tooltip } from 'antd';
import CadTrustLogo from '../../Assets/Images/cadtrust-logo.png';
import { CadTrustSyncModal } from './CadTrustSyncModal';
import {
  CadTrustSyncOverallStatus,
  CadTrustSyncScope,
} from './cadTrustSync.types';
import './cadTrustSync.scss';

export interface CadTrustSyncBadgeProps {
  scope: CadTrustSyncScope;
  refId?: string;
  creditBlockId?: string;
  status?: CadTrustSyncOverallStatus;
  /** Human label for the popup header chip — project name or credit serial number. */
  title?: string;
}

const TOOLTIP: Record<CadTrustSyncOverallStatus, string> = {
  NONE: '',
  IN_PROGRESS: 'CAD Trust sync in progress',
  SYNCED: 'Synced to CAD Trust',
  FAILED: 'CAD Trust sync failed',
};

export const CadTrustSyncBadge = ({
  scope,
  refId,
  creditBlockId,
  status,
  title,
}: CadTrustSyncBadgeProps) => {
  const [open, setOpen] = useState(false);

  // Only render once at least one sync record exists for this row.
  if (!status || status === 'NONE') {
    return null;
  }

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setOpen(true);
  };

  // The wrapper swallows clicks for the whole subtree — including the Modal,
  // which renders through a portal but still bubbles React events here. Without
  // this, clicking the popup's mask / close / toggles reaches the host table
  // cell's row-navigation handler.
  return (
    <span className="cadtrust-sync-badge-wrap" onClick={(e) => e.stopPropagation()}>
      <Tooltip title={TOOLTIP[status]}>
        <button
          type="button"
          className={`cadtrust-sync-badge cadtrust-sync-badge--${status.toLowerCase()}`}
          aria-label={TOOLTIP[status]}
          onClick={onClick}
        >
          <img className="cadtrust-sync-badge__img" src={CadTrustLogo} alt="" />
          <span className="cadtrust-sync-badge__dot" />
        </button>
      </Tooltip>
      {open && (
        <CadTrustSyncModal
          open={open}
          onClose={() => setOpen(false)}
          scope={scope}
          refId={refId}
          creditBlockId={creditBlockId}
          title={title}
        />
      )}
    </span>
  );
};
