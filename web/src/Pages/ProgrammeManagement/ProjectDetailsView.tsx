import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SLCFProjectDetailsViewComponent from '../../Components/ProjectDetailsView/SLCFProjectDetailsViewComponent';
import { ROUTES } from '../../Config/uiRoutingConfig';

const ProjectDetailsView = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation(['common', 'projectDetailsView']);

  const onNavigateToProgrammeManagementView = () => {
    navigate(ROUTES.VIEW_PROGRAMMES);
  };

  return (
    <SLCFProjectDetailsViewComponent
      translator={i18n}
      onNavigateToProgrammeView={onNavigateToProgrammeManagementView}
    ></SLCFProjectDetailsViewComponent>
  );
};

export default ProjectDetailsView;
