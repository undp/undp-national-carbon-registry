import { Link } from "react-router-dom";
import { ROUTES } from "../../Config/uiRoutingConfig";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import "./projectDetailsLink.scss";

interface ProjectDetailsLinkProps {
  projectId?: string | number | null;
  projectName: string;
  projectOwnerId?: string | number | null;
}

export const ProjectDetailsLink = ({
  projectId,
  projectName,
  projectOwnerId,
}: ProjectDetailsLinkProps) => {
  const { userInfoState } = useUserContext();

  if (projectId === undefined || projectId === null || projectId === "") {
    return <span>{projectName}</span>;
  }

  if (userInfoState?.companyRole === CompanyRole.PROJECT_DEVELOPER) {
    const ownerId =
      projectOwnerId === undefined ||
      projectOwnerId === null ||
      projectOwnerId === ""
        ? NaN
        : Number(projectOwnerId);
    if (!Number.isFinite(ownerId) || ownerId !== Number(userInfoState.companyId)) {
      return <span>{projectName}</span>;
    }
  }

  return (
    <Link
      className="credit-project-link"
      to={ROUTES.PROGRAMME_DETAILS_BY_ID(String(projectId))}
    >
      {projectName}
    </Link>
  );
};
