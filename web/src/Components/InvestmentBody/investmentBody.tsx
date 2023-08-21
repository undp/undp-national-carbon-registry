import React, { FC, useEffect, useState } from 'react';
import './investmentBody.scss';
import {
  InvestmentLevel,
  InvestmentStatus,
  InvestmentStream,
  InvestmentType,
  addCommSep,
  addSpaces,
} from '@undp/carbon-library';
import {
  BankOutlined,
  CheckCircleOutlined,
  DislikeOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  FlagOutlined,
  GlobalOutlined,
  LineChartOutlined,
} from '@ant-design/icons';

import moment from 'moment';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { Skeleton, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { TooltipColor } from '../../Pages/Common/role.color.constants';

export interface InvestmentBodyProps {
  data: any;
}

const InvestmentBody: FC<InvestmentBodyProps> = (props: InvestmentBodyProps) => {
  const { data } = props;
  const { get, put, post } = useConnection();
  const { t } = useTranslation(['programme']);
  const [loading, setLoading] = useState<boolean>(false);
  const [investmentData, setInvestmentData] = useState<any>({});

  useEffect(() => {
    setInvestmentData(data);
    console.log(data);
  }, [data]);

  return loading ? (
    <Skeleton />
  ) : (
    <div className="investment-body">
      <div className="invester">
        <div className="name-and-progress">
          <div className="name">{investmentData?.invester}</div>
          <div className="progress">
            {investmentData?.status === InvestmentStatus.APPROVED && (
              <CheckCircleOutlined className="common-progress-icon" style={{ color: '#5DC380' }} />
            )}
          </div>
        </div>
        <div className="time">
          {moment(parseInt(investmentData?.createdAt)).format('DD MMMM YYYY @ HH:mm')}
        </div>
      </div>
      <div className="amount">${addCommSep(investmentData?.amount)}</div>
      <div className="actions">
        {investmentData?.type !== null && (
          <div className="actions-icon-container">
            <Tooltip title={investmentData?.type} color={TooltipColor} key={TooltipColor}>
              {investmentData?.type === InvestmentType.PUBLIC ? (
                <EyeOutlined className="action-icons" />
              ) : (
                <EyeInvisibleOutlined className="action-icons" />
              )}
            </Tooltip>
          </div>
        )}
        {investmentData?.level !== null && (
          <div className="actions-icon-container">
            <Tooltip title={investmentData?.level} color={TooltipColor} key={TooltipColor}>
              {investmentData?.level === InvestmentLevel.INTERNATIONAL ? (
                <GlobalOutlined className="action-icons" />
              ) : (
                <FlagOutlined className="action-icons" />
              )}
            </Tooltip>
          </div>
        )}
        {investmentData?.stream !== null && (
          <div className="actions-icon-container">
            <Tooltip
              title={addSpaces(investmentData?.stream)}
              color={TooltipColor}
              key={TooltipColor}
            >
              {investmentData?.stream === InvestmentStream.CLIMATE_FINANCE ? (
                <BankOutlined className="action-icons" />
              ) : (
                <LineChartOutlined className="action-icons" />
              )}
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentBody;
