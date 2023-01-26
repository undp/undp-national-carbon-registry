import React, { FC, useEffect } from 'react';
import './profile.icon.scss';
import { Buffer } from 'buffer';

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

const ProfileIcon: FC<ProfileIconProps> = (props: ProfileIconProps) => {
  const { icon, bg, name } = props;

  return (
    <span className="profile-icon" style={{ backgroundColor: bg }}>
      {isBase64(icon) ? (
        <img src={'data:image/jpeg;base64,' + icon} />
      ) : icon ? (
        <img src={icon} />
      ) : name ? (
        name.charAt(0).toUpperCase()
      ) : (
        'A'
      )}
    </span>
  );
};
export default ProfileIcon;
