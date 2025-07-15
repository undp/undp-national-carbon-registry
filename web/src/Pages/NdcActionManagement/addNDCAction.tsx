import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSdgGoalImages } from '../../Definitions/InterfacesAndType/ndcAction.definitions';
import { AddNdcActionComponent } from '../../Components/NdcActions/AddNdcAction/addNdcActionComponent';
import { ROUTES } from '../../Config/uiRoutingConfig';

const AddNDCAction = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation([
    'ndcAction',
    'coBenifits',
    'common',
    'economic',
    'environment',
    'genderParity',
    'safeguards',
    'social',
    'unfcccSdTool',
    'socialEnvironmentalRisk',
  ]);
  const sdgGoalImages = getSdgGoalImages();

  const onNavigateToProgrammeManagementView = (programmeId: any) => {
    navigate(ROUTES.VIEW_PROGRAMMES, { state: { id: programmeId } });
  };

  const onNavigateToProgrammeView = (programmeDetails: any) => {
    navigate(ROUTES.PROGRAMME_DETAILS_BY_ID(programmeDetails.programmeId), {
      state: { record: programmeDetails },
    });
  };

  return (
    <AddNdcActionComponent
      translator={i18n}
      useLocation={useLocation}
      onNavigateToProgrammeView={onNavigateToProgrammeView}
      onNavigateToProgrammeManagementView={onNavigateToProgrammeManagementView}
      sdgGoalImages={sdgGoalImages}
    ></AddNdcActionComponent>
  );
};

export default AddNDCAction;
