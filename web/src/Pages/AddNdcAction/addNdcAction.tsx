import { AddNdcActionComponent } from '@undp/carbon-library';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AddNdcAction = () => {
  const navigate = useNavigate();
  const { t } = useTranslation([
    'ndcAction',
    'coBenifits',
    'economic',
    'environment',
    'genderParity',
    'safeguards',
    'social',
  ]);

  const onNavigateToProgrammeView = (programmeDetails: any) => {
    navigate('/programmeManagement/view', { state: { record: programmeDetails } });
  };

  const onNavigateToProgrammeManagementView = () => {
    navigate('/programmeManagement/viewAll', { replace: true });
  };

  return (
    <AddNdcActionComponent
      useConnection={useConnection}
      useLocation={useLocation}
      onNavigateToProgrammeView={onNavigateToProgrammeView}
      onNavigateToProgrammeManagementView={onNavigateToProgrammeManagementView}
      t={t}
    ></AddNdcActionComponent>
  );
};

export default AddNdcAction;
