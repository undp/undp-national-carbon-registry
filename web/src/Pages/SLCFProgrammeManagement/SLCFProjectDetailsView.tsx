import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SLCFProjectDetailsViewComponent from '../../Components/SLCFProgramme/ProjectDetailsView/SLCFProjectDetailsViewComponent';

const SLCFProjectDetailsView = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation(['common', 'projectDetailsView']);

  const onNavigateToProgrammeManagementView = () => {
    navigate('/programmeManagementSLCF/viewAll');
  };

  return (
    <SLCFProjectDetailsViewComponent
      translator={i18n}
      onNavigateToProgrammeView={onNavigateToProgrammeManagementView}
    ></SLCFProjectDetailsViewComponent>
  );
};

export default SLCFProjectDetailsView;
