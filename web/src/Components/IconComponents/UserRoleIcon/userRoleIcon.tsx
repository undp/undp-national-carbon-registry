import { EyeOutlined, SearchOutlined, StarOutlined, ToolOutlined } from '@ant-design/icons';
import React, { FC } from 'react';
import {
  AdminBGColor,
  AdminColor,
  ManagerBGColor,
  ManagerColor,
  RootBGColor,
  RootColor,
  ViewBGColor,
  ViewColor,
} from '../../../Styles/role.color.constants';
import { RoleIcon } from '../RoleIcon/role.icon';

export interface UserRoleIconProps {
  role: string;
}

export const UserRoleIcon: FC<UserRoleIconProps> = (props: UserRoleIconProps) => {
  const { role } = props;
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'row' }}>
      {role === 'Admin' ? (
        <RoleIcon icon={<StarOutlined />} bg={AdminBGColor} color={AdminColor} />
      ) : role === 'Root' ? (
        <RoleIcon icon={<SearchOutlined />} bg={RootBGColor} color={RootColor} />
      ) : role === 'Manager' ? (
        <RoleIcon icon={<ToolOutlined />} bg={ManagerBGColor} color={ManagerColor} />
      ) : (
        <RoleIcon icon={<EyeOutlined />} bg={ViewBGColor} color={ViewColor} />
      )}
      <div>{role === 'ViewOnly' ? 'Viewer' : role}</div>
    </div>
  );
};
