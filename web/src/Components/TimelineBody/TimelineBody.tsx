import { BankOutlined, ExperimentOutlined, SafetyOutlined } from '@ant-design/icons';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CertBGColor,
  CertColor,
  DevBGColor,
  DevColor,
  GovBGColor,
  GovColor,
} from '../../Pages/Common/role.color.constants';
import RoleIcon from '../RoleIcon/role.icon';

export interface TimelineBodyProps {
  text: string;
  remark?: string;
}

const TimelineBody: FC<TimelineBodyProps> = (props: TimelineBodyProps) => {
  const { i18n, t } = useTranslation(['view']);
  const { text, remark } = props;
  return (
    <div>
      <div>{text}</div>
      {remark && (
        <div>
          <div className="remark-title">{t('view:remark')}</div>
          <div className="remark-body">{remark}</div>
        </div>
      )}
    </div>
  );
};

export default TimelineBody;
