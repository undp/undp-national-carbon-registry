import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, Tag } from 'antd';
import { CreditBalanceTableComponent } from './Components/creditBalanceTable';
import './creditPageStyles.scss';

const accountTypeOptions = [
  { value: 'all', label: 'All Accounts' },
  { value: 'Holding', label: 'Holding' },
  { value: 'RetirementNDC', label: 'Retired (NDC)' },
  { value: 'RetirementOIMP', label: 'Retired (OIMP)' },
  { value: 'CancellationVoluntary', label: 'Cancelled (Voluntary)' },
  { value: 'CancellationOMGE', label: 'Cancelled (OMGE)' },
  { value: 'CancellationSOP', label: 'Cancelled (SOP)' },
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
