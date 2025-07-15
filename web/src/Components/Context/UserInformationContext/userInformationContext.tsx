import React, { useContext, useState, createContext, useCallback, useEffect } from 'react';
import jwt_decode from 'jwt-decode';
import { useConnection } from '../ConnectionContext/connectionContext';
import { UserContextProps, UserProps } from '../../../Definitions/Definitions/userInformationContext.definitions';

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
      ? parseInt(localStorage.getItem('userId') as string)
      : import.meta.env.STORYBOOK_USER_ID
      ? parseInt(import.meta.env.STORYBOOK_USER_ID)
      : -1,
    userRole: localStorage.getItem('userRole')
      ? (localStorage.getItem('userRole') as string)
      : import.meta.env.STORYBOOK_USER_ROLE
      ? import.meta.env.STORYBOOK_USER_ROLE
      : '',
    companyRole: localStorage.getItem('companyRole')
      ? (localStorage.getItem('companyRole') as string)
      : import.meta.env.STORYBOOK_COMPANY_ROLE
      ? import.meta.env.STORYBOOK_COMPANY_ROLE
      : '',
    companyId: localStorage.getItem('companyId')
      ? parseInt(localStorage.getItem('companyId') as string)
      : import.meta.env.STORYBOOK_COMPANY_ID
      ? parseInt(import.meta.env.STORYBOOK_COMPANY_ID)
      : -1,
    companyLogo: localStorage.getItem('companyLogo')
      ? (localStorage.getItem('companyLogo') as string)
      : import.meta.env.STORYBOOK_COMPANY_LOGO
      ? import.meta.env.STORYBOOK_COMPANY_LOGO
      : '',
    companyName: localStorage.getItem('companyName')
      ? (localStorage.getItem('companyName') as string)
      : import.meta.env.STORYBOOK_COMPANY_NAME
      ? import.meta.env.STORYBOOK_COMPANY_NAME
      : '',
    companyState: localStorage.getItem('companyState')
      ? parseInt(localStorage.getItem('companyState') as string)
      : import.meta.env.STORYBOOK_COMPANY_STATE
      ? parseInt(import.meta.env.STORYBOOK_COMPANY_STATE)
      : 0,
    name: localStorage.getItem('name') || '',
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
      name,
    } = value;
    if (id) {
      setUserInfoState((prev) => ({ ...prev, id }));
      localStorage.setItem('userId', id + '');
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
    if (name) {
      setUserInfoState((prev) => ({ ...prev, name }));
      localStorage.setItem('name', name);
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
