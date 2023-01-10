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
  IsAuthenticated: () => false,
});

export const UserInformationContextProvider = ({ children }: React.PropsWithChildren) => {
  const { token } = useConnection();
  const initialUserProps: UserProps = {
    id: '',
    userRole: '',
    companyRole: '',
    companyId: -1,
    companyLogo: ''
  };
  const [userInfoState, setUserInfoState] = useState<UserProps>(initialUserProps);

  const setUserInfo = (value: UserProps) => {
    const { id, userRole, companyId, companyRole, companyLogo } = value;
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
    }

    if (userRole) {
      setUserInfoState((prev) => ({ ...prev, companyRole }));
      localStorage.setItem('companyRole', companyRole);
    }
  };

  const IsAuthenticated = useCallback((): boolean => {
    let tokenVal: string | null;
    if (token) {
      tokenVal = token;
    } else {
      tokenVal = localStorage.getItem('token');

      setUserInfoState({
        id: localStorage.getItem('userId') as string,
        userRole: localStorage.getItem('userRole') as string,
        companyRole: localStorage.getItem('companyRole') as string,
        companyId: parseInt(localStorage.getItem('companyId') as string),
        companyLogo: localStorage.getItem('companyLogo') as string,
      });
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
  }, [token]);

  const removeUserInfo = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('companyId');
    localStorage.removeItem('companyRole');
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
