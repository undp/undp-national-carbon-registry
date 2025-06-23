import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ProjectDetailsViewComponent from "../../Components/ProjectDetailsView/ProjectDetailsViewComponent";
import { ROUTES } from "../../Config/uiRoutingConfig";

const ProjectDetailsView = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation(["common", "projectDetailsView"]);

  const onNavigateToProgrammeManagementView = () => {
    navigate(ROUTES.VIEW_PROGRAMMES);
  };

  return (
    <ProjectDetailsViewComponent
      translator={i18n}
      onNavigateToProgrammeView={onNavigateToProgrammeManagementView}
    ></ProjectDetailsViewComponent>
  );
};

export default ProjectDetailsView;
