import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProgrammeCreationComponent } from '../../Components/AddNewProgramme/ProgrammeCreationComponent';
import { ROUTES } from '../../Config/uiRoutingConfig';

const AddProgramme = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation(['common', 'addProgramme']);

  const onNavigateToProgrammeManagementView = () => {
    navigate(ROUTES.VIEW_PROGRAMMES);
  };

  return (
    <ProgrammeCreationComponent
      translator={i18n}
      useLocation={useLocation}
      onNavigateToProgrammeView={onNavigateToProgrammeManagementView}
    ></ProgrammeCreationComponent>
  );
};

export default AddProgramme;
