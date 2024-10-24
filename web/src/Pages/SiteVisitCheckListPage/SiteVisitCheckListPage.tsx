import React from 'react';
import { useTranslation } from 'react-i18next';
import SiteCheckListComponent from '../../Components/SiteCheckListComponent/SiteCheckListComponent';

const SiteVisitCheckListPage = () => {
  const { i18n } = useTranslation(['common', 'siteCheckList']);
  return <SiteCheckListComponent translator={i18n} />;
};

export default SiteVisitCheckListPage;
