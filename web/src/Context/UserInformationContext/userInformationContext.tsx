import React, { useContext, useState, createContext, useCallback, useEffect } from 'react';
import jwt_decode from 'jwt-decode';
import {
  UserContextProps,
  UserProps,
} from '../../Definitions/Definitions/userInformationContext.definitions';
import { useConnection } from '../ConnectionContext/connectionContext';

export const UserContext = createContext<UserContextProps>({
  setUserInfo: () => {},
  removeUserInfo: () => {},
  IsAuthenticated: (tkn?: any) => false,
  isTokenExpired: false,
  setIsTokenExpired: (val: boolean) => {},
});

export const UserInformationContextProvider = ({ children }: React.PropsWithChildren) => {
  const { token } = useConnection();

  const [isTokenExpired, setIsTokenExpired] = useState<boolean>(false);
  const initialUserProps: UserProps = {
    id: localStorage.getItem('userId')
      ? (localStorage.getItem('userId') as string)
      : process.env.STORYBOOK_USER_ID
      ? process.env.STORYBOOK_USER_ID
      : '',
    userRole: localStorage.getItem('userRole')
      ? (localStorage.getItem('userRole') as string)
      : process.env.STORYBOOK_USER_ROLE
      ? process.env.STORYBOOK_USER_ROLE
      : '',
    companyRole: localStorage.getItem('companyRole')
      ? (localStorage.getItem('companyRole') as string)
      : process.env.STORYBOOK_COMPANY_ROLE
      ? process.env.STORYBOOK_COMPANY_ROLE
      : '',
    companyId: localStorage.getItem('companyId')
      ? parseInt(localStorage.getItem('companyId') as string)
      : process.env.STORYBOOK_COMPANY_ID
      ? parseInt(process.env.STORYBOOK_COMPANY_ID)
      : -1,
    companyLogo: localStorage.getItem('companyLogo')
      ? (localStorage.getItem('companyLogo') as string)
      : process.env.STORYBOOK_COMPANY_LOGO
      ? process.env.STORYBOOK_COMPANY_LOGO
      : '',
    companyName: localStorage.getItem('companyName')
      ? (localStorage.getItem('companyName') as string)
      : process.env.STORYBOOK_COMPANY_NAME
      ? process.env.STORYBOOK_COMPANY_NAME
      : '',
    companyState: localStorage.getItem('companyState')
      ? parseInt(localStorage.getItem('companyState') as string)
      : process.env.STORYBOOK_COMPANY_STATE
      ? parseInt(process.env.STORYBOOK_COMPANY_STATE)
      : 0,
  };
  const [userInfoState, setUserInfoState] = useState<UserProps>(initialUserProps);

  const setUserInfo = (value: UserProps) => {
    const state = userInfoState?.companyState === 1 ? userInfoState?.companyState : 0;
    const {
      id,
      userRole,
      companyId,
      companyRole,
      companyLogo,
      companyName,
      companyState = state,
    } = value;
    if (id) {
      setUserInfoState((prev) => ({ ...prev, id }));
      localStorage.setItem('userId', id);
    }

    if (userRole) {
      setUserInfoState((prev) => ({ ...prev, userRole }));
      localStorage.setItem('userRole', userRole);
    }

    if (companyId) {
      setUserInfoState((prev) => ({ ...prev, companyId }));
      localStorage.setItem('companyId', companyId + '');
    }

    if (companyLogo) {
      setUserInfoState((prev) => ({ ...prev, companyLogo }));
      localStorage.setItem('companyLogo', companyLogo);
    } else {
      setUserInfoState((prev) => ({ ...prev, companyLogo: '' }));
      localStorage.setItem('companyLogo', '');
    }

    if (companyName) {
      setUserInfoState((prev) => ({ ...prev, companyName }));
      localStorage.setItem('companyName', companyName);
    }

    if (userRole) {
      setUserInfoState((prev) => ({ ...prev, companyRole }));
      localStorage.setItem('companyRole', companyRole);
    }

    setUserInfoState((prev) => ({ ...prev, companyState }));
    localStorage.setItem('companyState', companyState + '');
  };

  const IsAuthenticated = useCallback(
    (tokenNew?: any): boolean => {
      let tokenVal: string | null;
      if (tokenNew) {
        tokenVal = tokenNew;
      } else if (token) {
        tokenVal = token;
      } else {
        tokenVal = localStorage.getItem('token');
        if (tokenVal === '') {
          if (history.length !== 1) {
            setIsTokenExpired(true);
          }
        }
      }
      try {
        if (tokenVal) {
          const { exp } = jwt_decode(tokenVal) as any;
          return Date.now() < exp * 1000;
        }
        return false;
      } catch (err) {
        return false;
      }
    },
    [token]
  );

  const removeUserInfo = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('companyId');
    localStorage.removeItem('companyRole');
    localStorage.removeItem('companyName');
    localStorage.removeItem('companyState');
    localStorage.removeItem('companyLogo');
    setUserInfoState(initialUserProps);
  };

  return (
    <UserContext.Provider
      value={{
        userInfoState,
        setUserInfo,
        removeUserInfo,
        IsAuthenticated,
        isTokenExpired,
        setIsTokenExpired,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;

export const useUserContext = (): UserContextProps => {
  return useContext(UserContext);
};
