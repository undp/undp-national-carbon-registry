import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSdgGoalImages } from '../../Definitions/InterfacesAndType/ndcAction.definitions';
import Chart from 'react-apexcharts';
import { NdcActionViewComponent } from '../../Components/NdcActions/NdcView/ndcActionViewComponent';

const NdcActionView = () => {
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
  ]);
  const sdgGoalImages = getSdgGoalImages();

  const onNavigateToNdcManagementView = (record: any) => {
    navigate('/ndcManagement/viewAll', { replace: true });
  };

  return (
    <NdcActionViewComponent
      useLocation={useLocation}
      onNavigateToNdcManagementView={onNavigateToNdcManagementView}
      translator={i18n}
      sdgGoalImages={sdgGoalImages}
      Chart={Chart}
    ></NdcActionViewComponent>
  );
};

export default NdcActionView;
