import { AddNdcActionComponent } from '@undp/carbon-library';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import goal1 from '../../Assets/Images/SdgGoalsImages/goal-1.png';
import goal2 from '../../Assets/Images/SdgGoalsImages/goal-2.png';
import goal3 from '../../Assets/Images/SdgGoalsImages/goal-3.png';
import goal4 from '../../Assets/Images/SdgGoalsImages/goal-4.png';
import goal5 from '../../Assets/Images/SdgGoalsImages/goal-5.png';
import goal6 from '../../Assets/Images/SdgGoalsImages/goal-6.png';
import goal7 from '../../Assets/Images/SdgGoalsImages/goal-7.png';
import goal8 from '../../Assets/Images/SdgGoalsImages/goal-8.png';
import goal9 from '../../Assets/Images/SdgGoalsImages/goal-9.png';
import goal10 from '../../Assets/Images/SdgGoalsImages/goal-10.png';
import goal11 from '../../Assets/Images/SdgGoalsImages/goal-11.png';
import goal12 from '../../Assets/Images/SdgGoalsImages/goal-12.png';
import goal13 from '../../Assets/Images/SdgGoalsImages/goal-13.png';
import goal14 from '../../Assets/Images/SdgGoalsImages/goal-14.png';
import goal15 from '../../Assets/Images/SdgGoalsImages/goal-15.png';
import goal16 from '../../Assets/Images/SdgGoalsImages/goal-16.png';
import goal17 from '../../Assets/Images/SdgGoalsImages/goal-17.png';

import goal1Selected from '../../Assets/Images/SdgGoalsImages/goal-1-selected.png';
import goal2Selected from '../../Assets/Images/SdgGoalsImages/goal-2-selected.png';
import goal3Selected from '../../Assets/Images/SdgGoalsImages/goal-3-selected.png';
import goal4Selected from '../../Assets/Images/SdgGoalsImages/goal-4-selected.png';
import goal5Selected from '../../Assets/Images/SdgGoalsImages/goal-5-selected.png';
import goal6Selected from '../../Assets/Images/SdgGoalsImages/goal-6-selected.png';
import goal7Selected from '../../Assets/Images/SdgGoalsImages/goal-7-selected.png';
import goal8Selected from '../../Assets/Images/SdgGoalsImages/goal-8-selected.png';
import goal9Selected from '../../Assets/Images/SdgGoalsImages/goal-9-selected.png';
import goal10Selected from '../../Assets/Images/SdgGoalsImages/goal-10-selected.png';
import goal11Selected from '../../Assets/Images/SdgGoalsImages/goal-11-selected.png';
import goal12Selected from '../../Assets/Images/SdgGoalsImages/goal-12-selected.png';
import goal13Selected from '../../Assets/Images/SdgGoalsImages/goal-13-selected.png';
import goal14Selected from '../../Assets/Images/SdgGoalsImages/goal-14-selected.png';
import goal15Selected from '../../Assets/Images/SdgGoalsImages/goal-15-selected.png';
import goal16Selected from '../../Assets/Images/SdgGoalsImages/goal-16-selected.png';
import goal17Selected from '../../Assets/Images/SdgGoalsImages/goal-17-selected.png';

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

  const sdgGoalImages = {
    goal1,
    goal2,
    goal3,
    goal4,
    goal5,
    goal6,
    goal7,
    goal8,
    goal9,
    goal10,
    goal11,
    goal12,
    goal13,
    goal14,
    goal15,
    goal16,
    goal17,
    goal1Selected,
    goal2Selected,
    goal3Selected,
    goal4Selected,
    goal5Selected,
    goal6Selected,
    goal7Selected,
    goal8Selected,
    goal9Selected,
    goal10Selected,
    goal11Selected,
    goal12Selected,
    goal13Selected,
    goal14Selected,
    goal15Selected,
    goal16Selected,
    goal17Selected,
  };

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
      sdgGoalImages={sdgGoalImages}
      t={t}
    ></AddNdcActionComponent>
  );
};

export default AddNdcAction;
