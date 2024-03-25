import { NdcActionManagementComponent, ProgrammeCreationComponent } from '@undp/carbon-library';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AddProgramme = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation(['common', 'addProgramme']);

  const onNavigateToProgrammeManagementView = () => {
    navigate('/programmeManagement/viewAll');
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
