import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SLCFProgrammeCreationComponent } from '../../Components/SLCFProgramme/AddNewProgramme/SLCFProgrammeCreationComponent';

const SLCFAddProgramme = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation(['common', 'addProgramme']);

  const onNavigateToProgrammeManagementView = () => {
    navigate('/programmeManagement/viewAll');
  };

  return (
    <SLCFProgrammeCreationComponent
      translator={i18n}
      useLocation={useLocation}
      onNavigateToProgrammeView={onNavigateToProgrammeManagementView}
    ></SLCFProgrammeCreationComponent>
  );
};

export default SLCFAddProgramme;
