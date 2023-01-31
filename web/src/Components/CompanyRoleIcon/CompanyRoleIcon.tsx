import { BankOutlined, ExperimentOutlined, SafetyOutlined } from '@ant-design/icons';
import { FC } from 'react';
import {
  CertBGColor,
  CertColor,
  DevBGColor,
  DevColor,
  GovBGColor,
  GovColor,
} from '../../Pages/Common/role.color.constants';
import RoleIcon from '../RoleIcon/role.icon';

export interface CompanyRoleIconProps {
  role: string;
}

const CompanyRoleIcon: FC<CompanyRoleIconProps> = (props: CompanyRoleIconProps) => {
  const { role } = props;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {role === 'Government' ? (
        <RoleIcon icon={<BankOutlined />} bg={GovBGColor} color={GovColor} />
      ) : role === 'Certifier' ? (
        <RoleIcon icon={<SafetyOutlined />} bg={CertBGColor} color={CertColor} />
      ) : (
        <RoleIcon icon={<ExperimentOutlined />} bg={DevBGColor} color={DevColor} />
      )}
      {role === 'ProgrammeDeveloper' ? <div>{'Developer'}</div> : <div>{role}</div>}
    </div>
  );
};

export default CompanyRoleIcon;
