import { FC, useEffect } from 'react';
import { Progress, Skeleton, Tooltip } from 'antd';
import {
  ClockHistory,
  HandThumbsUp,
  XCircle,
  Clipboard2Pulse,
  InfoCircle,
} from 'react-bootstrap-icons';

export interface ProgrammeRejectAndTransferCardItemProps {
  totalPrgrammes: number;
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
  const { totalPrgrammes, pending, rejected, authorized, updatedDate, loading, toolTipText, t } =
    props;

  return (
    <div className="stastics-and-pie-card height-pie-rem">
      {loading ? (
        <div className="margin-top-2">
          <Skeleton active />
          <Skeleton active />
        </div>
      ) : (
        <>
          <div className="title-section">
            <div className="title">{t('programmes')}</div>
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
              <div className="detail">Total</div>
              <div className="value">{totalPrgrammes}</div>
            </div>
            <div className="icon">
              <Clipboard2Pulse color="#16B1FF" size={80} />
            </div>
          </div>
          <div className="total-programme-extra-details">
            <div className="rejected-details margin-top-1">
              <div className="icon">
                <div className="icon-container authorized">
                  <HandThumbsUp color="#16B1FF" size={25} />
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
                    percent={(authorized / totalPrgrammes) * 100}
                    status="active"
                    strokeColor={{ from: '#B9E2F4', to: '#6ACDFF' }}
                  />
                </div>
              </div>
            </div>
            <div className="transfered-details margin-top-1">
              <div className="icon">
                <div className="icon-container reject">
                  <XCircle
                    style={{
                      color: '#FF4D4F',
                      fontSize: '25px',
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
                    percent={(rejected / totalPrgrammes) * 100}
                    status="active"
                    strokeColor={{ from: '#FFA6A6', to: '#FF8183' }}
                  />
                </div>
              </div>
            </div>
            <div className="transfered-details margin-top-1">
              <div className="icon">
                <div className="icon-container pending">
                  <ClockHistory color="#6c6c6c" size={25} />
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
                    percent={(pending / totalPrgrammes) * 100}
                    status="active"
                    strokeColor={{ from: '#F0F0F0', to: '#D8D8D8' }}
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
