import React, { FC, useEffect } from 'react';
import { Buffer } from 'buffer';
import './profile.icon.scss';

export interface ProfileIconProps {
  icon: any;
  bg: string;
  name: string;
}
export const isBase64 = (str: string) => {
  if (!str || str === '' || str.trim() === '') {
    return false;
  }
  try {
    const bs = Buffer.from(str, 'base64').toString('base64');
    return bs === str;
  } catch (err) {
    return false;
  }
};

export const ProfileIcon: FC<ProfileIconProps> = (props: ProfileIconProps) => {
  const { icon, bg, name } = props;

  return (
    <span className="profile-icon" style={{ backgroundColor: bg }}>
      {isBase64(icon) ? (
        <img alt="profile-icon" src={'data:image/jpeg;base64,' + icon} />
      ) : icon ? (
        <img alt="profile-icon" src={icon} />
      ) : name ? (
        name.charAt(0).toUpperCase()
      ) : (
        'A'
      )}
    </span>
  );
};
