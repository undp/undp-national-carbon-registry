import React, { FC } from 'react';
import './role.icon.scss';

export interface RoleIconProps {
  icon: any;
  bg: string;
  color: string;
}

export const RoleIcon: FC<RoleIconProps> = (props: RoleIconProps) => {
  const { icon, bg, color } = props;

  return (
    <span className="role-icon" style={{ backgroundColor: bg, color: color }}>
      {icon}
    </span>
  );
};
