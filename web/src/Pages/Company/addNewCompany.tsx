import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AddNewCompanyComponent } from "../../Components/Company/AddNewCompany/addNewCompanyComponent";
import { ROUTES } from "../../Config/uiRoutingConfig";

const AddNewCompany = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["addCompany"]);

  const maximumImageSize = import.meta.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(import.meta.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 1048576;

  const onNavigateToCompanyManagement = () => {
    navigate(ROUTES.VIEW_ORGANIZATIONS, { replace: true });
  };

  return (
    <AddNewCompanyComponent
      t={t}
      onNavigateToCompanyManagement={onNavigateToCompanyManagement}
      maximumImageSize={maximumImageSize}
      useLocation={useLocation}
      regionField
    ></AddNewCompanyComponent>
  );
};

export default AddNewCompany;
