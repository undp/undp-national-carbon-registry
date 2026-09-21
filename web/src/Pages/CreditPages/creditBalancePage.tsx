import { useCallback, useEffect, useRef, useState } from 'react';
import { Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  FilterBar,
  type FilterControlValue,
  type FilterValue,
  type FilterValues,
  usePaginatedEntityFilter,
} from '../../Components/Common/FilterBar';
import { API_PATHS } from '../../Config/apiConfig';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { CompanyRole } from '../../Definitions/Enums/company.role.enum';
import {
  CreditBalanceByProjectTable,
} from './Components/creditBalanceByProjectTable';
import {
  CreditBalanceByOrganizationTable,
} from './Components/creditBalanceByOrganizationTable';
import { TimedPageInfoTitle } from '../../Components/Common/TimedPageInfoTitle/TimedPageInfoTitle';
import './creditPageStyles.scss';

type BalanceView = 'project' | 'organization';

export const CreditBalancePage = () => {
  const { t } = useTranslation(['creditPages']);
  const { userInfoState } = useUserContext();
  const [view, setView] = useState<BalanceView>('project');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [refreshGeneration, setRefreshGeneration] = useState(0);
  const refreshTimer = useRef<ReturnType<typeof setTimeout>>();
  const canViewOrganization =
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY;
  // The "By Organization" tab (balances aggregated across every org) stays
  // DNA-only, but the organization filter in "By Project" just narrows by
  // project owner — PDs can use that too.
  const canFilterOrganization =
    canViewOrganization || userInfoState?.companyRole === CompanyRole.PROJECT_DEVELOPER;

  useEffect(() => {
    if (!canViewOrganization && view === 'organization') {
      setView('project');
    }
  }, [canViewOrganization, view]);

  useEffect(() => {
    if (!canFilterOrganization) {
      setFilterValues((current) => {
        const organizations = current.organizations;
        return Array.isArray(organizations) && organizations.length === 0
          ? current
          : { ...current, organizations: [] };
      });
    }
  }, [canFilterOrganization]);

  const selectedOrganizationIds = canFilterOrganization
    && Array.isArray(filterValues.organizations)
    ? filterValues.organizations.map(String)
    : [];
  const selectedProjects = Array.isArray(filterValues.projects)
    ? filterValues.projects.map(String)
    : [];

  const onFilterChange = (id: string, value: FilterControlValue) => {
    setFilterValues((current) => ({ ...current, [id]: value }));
  };

  const orgFilter = usePaginatedEntityFilter({
    endpoint: API_PATHS.ORGANIZATION_NAME_IDS,
    id: 'organizations',
    mode: 'multiple',
    placeholder: t('selectOrganization'),
    labelKey: 'name',
    valueKey: 'companyId',
    sortKey: 'name',
    extraFilters: [
      { key: 'companyRole', operation: '=', value: CompanyRole.PROJECT_DEVELOPER },
      { key: 'state', operation: 'in', value: ['0', '1'] },
    ],
    selectedValues: (filterValues.organizations as FilterValue[]) ?? [],
  });

  const projectFilter = usePaginatedEntityFilter({
    endpoint: API_PATHS.CREDIT_BALANCE_PROJECT_NAMES,
    id: 'projects',
    mode: 'multiple',
    placeholder: t('selectProject'),
    labelKey: 'projectName',
    valueKey: 'projectIds',
    searchKey: 'title',
    sortKey: 'projectName',
    selectedValues: (filterValues.projects as FilterValue[]) ?? [],
  });

  const triggerBalanceRefresh = useCallback(() => {
    setRefreshGeneration((current) => current + 1);
  }, []);

  const refreshBalances = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      triggerBalanceRefresh();
      refreshTimer.current = undefined;
    }, 1000);
  }, [triggerBalanceRefresh]);

  useEffect(() => {
    const refreshWhenPageBecomesActive = () => {
      if (document.visibilityState === 'visible') {
        triggerBalanceRefresh();
      }
    };

    window.addEventListener('focus', triggerBalanceRefresh);
    document.addEventListener('visibilitychange', refreshWhenPageBecomesActive);

    return () => {
      window.removeEventListener('focus', triggerBalanceRefresh);
      document.removeEventListener('visibilitychange', refreshWhenPageBecomesActive);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [triggerBalanceRefresh]);

  return (
    <div className="content-container credit-management credit-balance-redesign">
      <div className="credit-title-bar">
        <div className="title-bar">
          <TimedPageInfoTitle
            title={t('creditBalance')}
            description={t('creditBalancePageDescription', {
              defaultValue:
                'Review available and reserved credit balances grouped by project or organization.',
            })}
            infoButtonLabel={t('showCreditBalancePageDescription', {
              defaultValue: 'Show information about Credit Balance',
            })}
          />

          <section className="content-card credit-balance-card">
            <div className="credit-balance-toolbar">
              <div className="credit-balance-tabs radio-selection">
                <Radio.Group
                  value={view}
                  aria-label="Credit balance grouping"
                  onChange={(event) => {
                    const nextView = event.target.value as BalanceView;
                    if (nextView === 'project' || canViewOrganization) {
                      setView(nextView);
                    }
                  }}
                >
                  <Radio.Button className="overall" value="project">By Project</Radio.Button>
                  <Radio.Button
                    className="mine"
                    value="organization"
                    disabled={!canViewOrganization}
                  >
                    By Organization
                  </Radio.Button>
                </Radio.Group>
              </div>

              <FilterBar
                className="credit-balance-filter-bar"
                values={filterValues}
                controls={[
                  { ...orgFilter.control, width: 240, visible: canFilterOrganization },
                  { ...projectFilter.control, width: 280, visible: view === 'project' },
                ]}
                onChange={onFilterChange}
                appliedFiltersLabel={t('appliedFilters')}
                clearAllLabel={t('clearAll')}
                selectAllLabel={t('selectAll')}
                onClearAll={() => setFilterValues({ organizations: [], projects: [] })}
              />
            </div>

            {view === 'project' ? (
              <CreditBalanceByProjectTable
                selectedOrganizationIds={selectedOrganizationIds}
                selectedProjects={selectedProjects}
                refreshGeneration={refreshGeneration}
                onBalanceChanged={refreshBalances}
              />
            ) : canViewOrganization ? (
              <CreditBalanceByOrganizationTable
                selectedOrganizationIds={selectedOrganizationIds}
                refreshGeneration={refreshGeneration}
              />
            ) : (
              <CreditBalanceByProjectTable
                selectedOrganizationIds={selectedOrganizationIds}
                selectedProjects={selectedProjects}
                refreshGeneration={refreshGeneration}
                onBalanceChanged={refreshBalances}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
