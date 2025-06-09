import React, { createContext, FC, useCallback, useContext, useEffect, useState } from 'react';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import jwt_decode from 'jwt-decode';
import {
  ConnectionProps,
  ConnectionContextProviderProps,
  Methods,
} from '../../Definitions/Definitions/connectionContext.definitions';

const ConnectionContext = createContext<{
  connection?: ConnectionProps;
}>({});

export const ConnectionContextProvider: FC<ConnectionContextProviderProps> = (
  props: ConnectionContextProviderProps
) => {
  const [token, setToken] = useState<string>();
  const [refreshToken, setRefreshToken] = useState<string>();
  const { serverURL, t, statServerUrl, children } = props;

  useEffect(() => {
    const timer = setInterval(async () => {
      const newToken: any = await localStorage.getItem('token');
      if (token !== newToken) {
        setToken(newToken);
      }
    }, 3000);
    if (token) {
      clearTimeout(timer);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [token]);

  const send = useCallback(
    (method: Methods, path: string, data?: any, config?: AxiosRequestConfig, extraUrl?: string) => {
      return new Promise((resolve, reject) => {
        const url = `${extraUrl ? extraUrl : serverURL}/${path}`;
        let headers: any;
        if (token) {
          headers = { authorization: `Bearer ${token.toString()}` };
        } else {
          if (localStorage.getItem('token')) {
            headers = {
              authorization: `Bearer ${localStorage.getItem('token')}`,
            };
          } else {
            headers = {
              authorization: `Bearer ${process.env.STORYBOOK_ACCESS_TOKEN}`,
            };
          }
        }
        axios({
          method,
          url,
          data,
          headers,
          ...config,
        })
          .then((response: AxiosResponse) => {
            if (response.status) {
              if (response.status === 200 || response.status === 201) {
                resolve({
                  status: response.status,
                  data: response.data.data ?? response.data,
                  response: response,
                  statusText: 'SUCCESS',
                  message: response.data.message,
                });
              } else if (response.status === 422) {
                reject({
                  status: response.status,
                  data: response.data?.data,
                  statusText: 'ERROR',
                  response: response,
                  message: response.data.message,
                  errors: response.data?.errors,
                });
              }
            } else {
              reject({
                status: 500,
                statusText: 'UNKNOWN',
                message: t('common:systemError'),
              });
            }
          })
          .catch((e: any) => {
            if (e.response) {
              if (e.response.status) {
                if (
                  e.response.data.message === 'jwt expired' ||
                  e.response.data.message === t('common:organisationDeactivated')
                ) {
                  setToken(undefined);
                  setRefreshToken(undefined);
                  // eslint-disable-next-line no-use-before-define, @typescript-eslint/no-use-before-define
                  clearLocalStorageData();
                  // window.location.reload();
                }

                reject({
                  status: e.response.status,
                  statusText: 'ERROR',
                  errors: e.response.data?.errors,
                  message: e.response.data.message,
                });
              } else {
                reject({
                  statusText: 'ERROR',
                  message: t('common:systemError'),
                });
              }
            } else {
              reject({
                statusText: 'ERROR',
                message: t('common:networkError'),
              });
            }
          });
      }) as any;
    },
    [token, serverURL]
  );
  const post = useCallback(
    (path: string, data?: any, config?: AxiosRequestConfig, extraUrl?: string) => {
      return send('post', path, data, config, extraUrl);
    },
    [send]
  );
  const put = useCallback(
    (path: string, data?: any, config?: AxiosRequestConfig) => {
      return send('put', path, data, config);
    },
    [send]
  );
  const get = useCallback(
    (path: string, config?: AxiosRequestConfig, extraUrl?: string) => {
      return send('get', path, undefined, config, extraUrl);
    },
    [send]
  );
  const patch = useCallback(
    (path: string, data?: any, config?: AxiosRequestConfig) => {
      return send('patch', path, data, config);
    },
    [send]
  );
  const del = useCallback(
    (path: string, config?: AxiosRequestConfig) => {
      return send('delete', path, config);
    },
    [send]
  );

  const updateToken = useCallback(async (newToken?: string) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
      setToken(newToken);
    } else {
      localStorage.setItem('token', '');
      setToken(undefined);
    }
  }, []);

  const updateRefreshToken = useCallback(async (newRefreshToken?: string) => {
    if (newRefreshToken) {
      localStorage.setItem('refresh_token', newRefreshToken);
      setRefreshToken(newRefreshToken);
    } else {
      localStorage.setItem('refresh_token', '');
      setRefreshToken(undefined);
    }
  }, []);

  const refreshAccessToken = async () => {
    const response = await post('national/auth/login/refresh', {
      refreshToken,
    });
    return response;
  };

  const clearLocalStorageData = () => {
    localStorage.setItem('token', '');
    localStorage.setItem('refresh_token', '');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('companyId');
    localStorage.removeItem('companyRole');
  };

  const removeToken = async (tkn?: string) => {
    if (tkn) {
      const { exp } = jwt_decode(tkn) as any;
      const now = Date.now();
      const tokenExpireTime = exp * 1000;
      if (now > tokenExpireTime) {
        clearLocalStorageData();
      } else {
        const diff = tokenExpireTime - now - 5000;
        if (diff > 0) {
          setTimeout(async () => {
            // eslint-disable-next-line eqeqeq
            if (refreshToken && refreshToken != '') {
              const response = await refreshAccessToken();
              if (response) {
                if (response.status === 200 || response.status === 201) {
                  if (response.data?.access_token) {
                    setToken(response.data?.access_token);
                  } else {
                    setToken(undefined);
                    setRefreshToken(undefined);
                    clearLocalStorageData();
                  }
                } else {
                  setToken(undefined);
                  setRefreshToken(undefined);
                  clearLocalStorageData();
                }
              } else {
                setToken(undefined);
                setRefreshToken(undefined);
                clearLocalStorageData();
              }
            }
          }, diff);
        } else {
          // If the difference is 0 or negative, clear data immediately
          setToken(undefined);
          setRefreshToken(undefined);
          clearLocalStorageData();
        }
        console.log(diff, 'Remaining Token expire time');
      }
    }
  };

  useEffect(() => {
    removeToken(token);
  }, [token]);

  return (
    <ConnectionContext.Provider
      value={{
        connection: {
          post,
          put,
          get,
          patch,
          delete: del,
          updateToken,
          updateRefreshToken,
          token,
          refreshToken,
          removeToken,
          statServerUrl,
        },
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

export default ConnectionContext;

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  return context.connection!;
};
