import {
  AuditOutlined,
  BankOutlined,
  CopyrightOutlined,
  ExperimentOutlined,
  SafetyOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import React, { FC } from 'react';
import {
  CertBGColor,
  CertColor,
  CFBGColor,
  CFColor,
  DevBGColor,
  DevColor,
  ECBGColor,
  ECColor,
  GovBGColor,
  GovColor,
  MinBGColor,
  MinColor,
} from '../../../Styles/role.color.constants';
import { RoleIcon } from '../RoleIcon/role.icon';

export interface CompanyRoleIconProps {
  t: any;
  role: string;
}

const CompanyRoleIcon: FC<CompanyRoleIconProps> = (props: CompanyRoleIconProps) => {
  const { role, t } = props;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {role === 'Government' ? (
        <RoleIcon icon={<BankOutlined />} bg={GovBGColor} color={GovColor} />
      ) : role === 'Certifier' ? (
        <RoleIcon icon={<SafetyOutlined />} bg={CertBGColor} color={CertColor} />
      ) : role === 'ProgrammeDeveloper' ? (
        <RoleIcon icon={<ExperimentOutlined />} bg={DevBGColor} color={DevColor} />
      ) : role === 'ClimateFund' ? (
        <RoleIcon icon={<CopyrightOutlined />} bg={CFBGColor} color={CFColor} />
      ) : role === 'ExecutiveCommittee' ? (
        <RoleIcon icon={<TeamOutlined />} bg={ECBGColor} color={ECColor} />
      ) : (
        <RoleIcon icon={<AuditOutlined />} bg={MinBGColor} color={MinColor} />
      )}
      {/* <div>{t(`"companyRoles:${role}`)}</div> */}
      <div>{t('companyRoles:' + role)}</div>
    </div>
  );
};

export default CompanyRoleIcon;
