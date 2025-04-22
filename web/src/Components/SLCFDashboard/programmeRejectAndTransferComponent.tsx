import { FC } from 'react';
import { Progress, Skeleton, Tooltip } from 'antd';
import { ClockHistory, HandThumbsUp, XCircle, InfoCircle } from 'react-bootstrap-icons';

export interface ProgrammeRejectAndTransferCardItemProps {
  totalProgrammes: number;
  authorized: number;
  pending: number;
  rejected: number;
  updatedDate: any;
  loading: boolean;
  toolTipText: string;
  t: any;
}

export const ProgrammeRejectAndTransferComponent: FC<ProgrammeRejectAndTransferCardItemProps> = (
  props: ProgrammeRejectAndTransferCardItemProps
) => {
  const { totalProgrammes, pending, rejected, authorized, updatedDate, loading, toolTipText, t } =
    props;

  return (
    <div className="statistics-and-pie-card height-pie-rem">
      {loading ? (
        <div className="margin-top-2">
          <Skeleton active />
          <Skeleton active />
        </div>
      ) : (
        <>
          <div className="title-section">
            <div className="title">{t('programmesByStatusSLCF')}</div>
            <div className="info-container">
              <Tooltip
                arrowPointAtCenter
                placement="bottomRight"
                trigger="hover"
                title={toolTipText}
              >
                <InfoCircle color="#000000" size={17} />
              </Tooltip>
            </div>
          </div>
          <div className="total-programme-details">
            <div className="details">
              <div className="detail">Total Projects</div>
              <div className="value">{totalProgrammes}</div>
            </div>
          </div>
          <div className="total-programme-extra-details">
            <div className="rejected-details margin-top-1">
              <div className="icon">
                <div className="icon-container authorized">
                  <HandThumbsUp color="rgba(22, 200, 199, 1)" size={19} />
                </div>
              </div>
              <div className="details">
                <div className="label-and-value">
                  <div className="label">Authorised</div>
                  <div className="value">{authorized}</div>
                </div>
                <div className="stastic-bar">
                  <Progress
                    showInfo={false}
                    percent={(authorized / totalProgrammes) * 100}
                    status="active"
                    strokeColor={{ from: 'rgba(186, 239, 239, 1)', to: 'rgba(22, 200, 199, 1)' }}
                  />
                </div>
              </div>
            </div>
            <div className="transfered-details margin-top-1">
              <div className="icon">
                <div className="icon-container reject">
                  <XCircle
                    style={{
                      color: 'rgba(255, 99, 97, 1)',
                      fontSize: '19px',
                    }}
                  />
                </div>
              </div>
              <div className="details">
                <div className="label-and-value">
                  <div className="label">Rejected</div>
                  <div className="value">{rejected}</div>
                </div>
                <div className="stastic-bar">
                  <Progress
                    showInfo={false}
                    percent={(rejected / totalProgrammes) * 100}
                    status="active"
                    strokeColor={{ from: 'rgba(255, 99, 97, 0.22)', to: 'rgba(255, 99, 97, 1)' }}
                  />
                </div>
              </div>
            </div>
            <div className="transfered-details margin-top-1">
              <div className="icon">
                <div className="icon-container pending">
                  <ClockHistory color="rgba(72, 150, 254, 1)" size={19} />
                </div>
              </div>
              <div className="details">
                <div className="label-and-value">
                  <div className="label">Pending</div>
                  <div className="value">{pending}</div>
                </div>
                <div className="stastic-bar">
                  <Progress
                    showInfo={false}
                    percent={(pending / totalProgrammes) * 100}
                    status="active"
                    strokeColor={{
                      '0%': 'rgba(106, 205, 255, 1)', // Starting color
                      '50%': 'rgba(90, 179, 255, 1)', // Middle color
                      '100%': 'rgba(72, 150, 254, 1)', // Ending color
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="updated-on margin-top-6">
            {updatedDate !== '0' && <div className="updated-moment-container">{updatedDate}</div>}
          </div>
        </>
      )}
    </div>
  );
};
