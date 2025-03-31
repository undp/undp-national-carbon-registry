import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { ReactComponent as UploadingSVG } from '../../../Assets/Images/uploading.svg';
import { ActivityStateEnum } from '../../../Definitions/Enums/programmeStage.enum';
import { Iactivity } from '../projectForms/VerificationPhaseForms';
import './verificationPhaseStatus.scss';
import { RefObject, useEffect, useState } from 'react';

interface IVerificationPhaseStatus {
  activity: Iactivity;
  timelineRef: RefObject<HTMLDivElement>;
}
const VerificationPhaseStatus = (props: IVerificationPhaseStatus) => {
  const { activity, timelineRef } = props;

  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    if (timelineRef && timelineRef.current !== null) {
      setHeight(timelineRef.current.offsetHeight);
    }
  }, [timelineRef]);

  return (
    <div
      className="verification-phase-section"
      style={{ height: height ? `${height}px` : 'fit-content' }}
    >
      <div className="verification-title-section">
        <UploadingSVG className="uploading-icon" />
        <p className="title">Verification Phase</p>
      </div>
      <div className="verification-activities">
        {activity.stage === ActivityStateEnum.MONITORING_REPORT_UPLOADED && (
          <ul className="list">
            <li className="style-disk active next">Monitoring Report</li>
            <li className="style-disk disable">Verification Report</li>
          </ul>
        )}
        {activity.stage === ActivityStateEnum.MONITORING_REPORT_REJECTED && (
          <ul className="list">
            <li className="style-none active">
              <span className="rejected-icon">
                <CloseOutlined />
              </span>
              Monitoring Report
            </li>
            <li className="style-disk disable">Verification Report</li>
          </ul>
        )}
        {activity.stage === ActivityStateEnum.MONITORING_REPORT_VERIFIED && (
          <ul className="list">
            <li className="style-none active">
              <span className="verified-icon">
                <CheckOutlined />
              </span>
              Monitoring Report
            </li>
            <li className="style-disk next">Verification Report</li>
          </ul>
        )}
        {activity.stage === ActivityStateEnum.VERIFICATION_REPORT_UPLOADED && (
          <ul className="list">
            <li className="style-none active">
              <span className="verified-icon">
                <CheckOutlined />
              </span>
              Monitoring Report
            </li>
            <li className="style-disk active">Verification Report</li>
          </ul>
        )}
        {activity.stage === ActivityStateEnum.VERIFICATION_REPORT_REJECTED && (
          <ul className="list">
            <li className="style-none active">
              <span className="verified-icon">
                <CheckOutlined />
              </span>
              Monitoring Report
            </li>
            <li className="style-none active">
              <span className="rejected-icon">
                <CloseOutlined />
              </span>
              Verification Report
            </li>
          </ul>
        )}
        {activity.stage === ActivityStateEnum.VERIFICATION_REPORT_VERIFIED && (
          <ul className="list">
            <li className="style-none active">
              <span className="verified-icon">
                <CheckOutlined />
              </span>
              Monitoring Report
            </li>
            <li className="style-none active">
              <span className="verified-icon">
                <CheckOutlined />
              </span>
              Verification Report
            </li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default VerificationPhaseStatus;
