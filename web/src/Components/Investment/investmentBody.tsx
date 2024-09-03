import React, { FC, useEffect, useState } from 'react';
import './investmentBody.scss';
import {
  BankOutlined,
  CheckCircleOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  FlagOutlined,
  GlobalOutlined,
  LineChartOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

import moment from 'moment';
import { Skeleton, Tooltip } from 'antd';
import {
  InvestmentLevel,
  InvestmentStatus,
  InvestmentStream,
  InvestmentType,
} from '../../Definitions/Enums/investment.enum';
import { addCommSep, addSpaces } from '../../Definitions/Definitions/programme.definitions';
import { TooltipColor } from '../../Styles/role.color.constants';
// import { TooltipColor } from '../../../Styles/role.color.constants';
// import {
//   InvestmentLevel,
//   InvestmentStatus,
//   InvestmentStream,
//   InvestmentType,
//   addCommSep,
//   addSpaces,
// } from '../../../Definitions';

export interface InvestmentBodyProps {
  data: any;
  translator: any;
}

export const InvestmentBody: FC<InvestmentBodyProps> = (props: InvestmentBodyProps) => {
  const { data, translator } = props;
  const t = translator.t;
  const [loading, setLoading] = useState<boolean>(false);
  const [investmentData, setInvestmentData] = useState<any>({});

  useEffect(() => {
    setInvestmentData(data);
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
            {investmentData?.status === InvestmentStatus.REJECTED && (
              <ExclamationCircleOutlined
                className="common-progress-icon"
                style={{ color: '#FD6F70' }}
              />
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
