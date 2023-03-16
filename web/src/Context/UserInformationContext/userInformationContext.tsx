import React, { useContext, useState, createContext, useCallback } from 'react';
import {
  UserContextProps,
  UserProps,
} from '../../Definitions/InterfacesAndType/userInformationContext.definitions';
import { useConnection } from '../ConnectionContext/connectionContext';
import jwt_decode from 'jwt-decode';

export const UserContext = createContext<UserContextProps>({
  setUserInfo: () => {},
  removeUserInfo: () => {},
  IsAuthenticated: (tkn?: any) => false,
});

export const UserInformationContextProvider = ({ children }: React.PropsWithChildren) => {
  const { token } = useConnection();
  const initialUserProps: UserProps = {
    id: localStorage.getItem('userId') ? (localStorage.getItem('userId') as string) : '',
    userRole: localStorage.getItem('userRole') ? (localStorage.getItem('userRole') as string) : '',
    companyRole: localStorage.getItem('companyRole')
      ? (localStorage.getItem('companyRole') as string)
      : '',
    companyId: localStorage.getItem('companyId')
      ? parseInt(localStorage.getItem('companyId') as string)
      : -1,
    companyLogo: localStorage.getItem('companyLogo')
      ? (localStorage.getItem('companyLogo') as string)
      : '',
    companyName: localStorage.getItem('companyName')
      ? (localStorage.getItem('companyName') as string)
      : '',
    companyState: localStorage.getItem('companyState')
      ? parseInt(localStorage.getItem('companyState') as string)
      : 0,
  };
  const [userInfoState, setUserInfoState] = useState<UserProps>(initialUserProps);

  const setUserInfo = (value: UserProps) => {
    const {
      id,
      userRole,
      companyId,
      companyRole,
      companyLogo,
      companyName,
      companyState = 0,
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
        console.log('token from response -- 89 ---- ', tokenNew);
        tokenVal = tokenNew;
      } else if (token) {
        tokenVal = token;
        console.log('token from userContext ---- ', token);
      } else {
        tokenVal = localStorage.getItem('token');
        console.log('token from userContext local storage ---- ', tokenVal);
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
