import { AuditOutlined, BankOutlined, ExperimentOutlined, SafetyOutlined } from '@ant-design/icons';
import React, { FC } from 'react';
import {
  CertBGColor,
  CertColor,
  DevBGColor,
  DevColor,
  GovBGColor,
  GovColor,
  MinBGColor,
  MinColor,
} from '../../../Styles/role.color.constants';
import { RoleIcon } from '../RoleIcon/role.icon';

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
      ) : role === 'ProgrammeDeveloper' ? (
        <RoleIcon icon={<ExperimentOutlined />} bg={DevBGColor} color={DevColor} />
      ) : (
        <RoleIcon icon={<AuditOutlined />} bg={MinBGColor} color={MinColor} />
      )}
      {role === 'ProgrammeDeveloper' ? <div>{'Developer'}</div> : <div>{role}</div>}
    </div>
  );
};

export default CompanyRoleIcon;
