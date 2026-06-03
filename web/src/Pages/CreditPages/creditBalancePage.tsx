import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from 'antd';
import { CreditBalanceTableComponent } from './Components/creditBalanceTable';
import './creditPageStyles.scss';

// Account buckets follow the A6.2 action vocabulary: ITMOs are "used" (towards
// NDC / for OIMP) or "cancelled" (voluntary / OMGE / SOP), not "retired". Only
// the labels change here — the stored `value` strings are unchanged so existing
// data and the backend filter keep working. SOP carries an A6.2-review flag.
const accountTypeOptions = [
  { value: 'all', label: 'All Accounts' },
  { value: 'Holding', label: 'Holding' },
  { value: 'RetirementNDC', label: 'Used (Towards NDC)' },
  { value: 'RetirementOIMP', label: 'Used (For OIMP)' },
  { value: 'CancellationVoluntary', label: 'Cancelled (Voluntary)' },
  { value: 'CancellationOMGE', label: 'Cancelled (OMGE)' },
  { value: 'CancellationSOP', label: 'Cancelled (SOP) *' },
];

export const CreditBalancePage = () => {
  const { t } = useTranslation(['creditPages']);
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('all');

  return (
    <div className="content-container credit-management">
      <div className="credit-title-bar">
        <div className="title-bar">
          <div className="body-title" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {t('creditBalance')}
            <Select
              value={accountTypeFilter}
              onChange={setAccountTypeFilter}
              options={accountTypeOptions}
              style={{ width: 200, fontSize: '0.875rem' }}
              size="small"
            />
          </div>
          <CreditBalanceTableComponent t={t} accountTypeFilter={accountTypeFilter} />
        </div>
      </div>
    </div>
  );
};
