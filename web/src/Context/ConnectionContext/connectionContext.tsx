import React, { createContext, FC, useCallback, useContext, useEffect, useState } from 'react';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import jwt_decode from 'jwt-decode';
import { useTranslation } from 'react-i18next';
import { ConnectionContextProviderProps, ConnectionProps, Methods } from '@undp/carbon-library';

const ConnectionContext = createContext<{
  connection?: ConnectionProps;
}>({});

export const ConnectionContextProvider: FC<ConnectionContextProviderProps> = (
  props: ConnectionContextProviderProps
) => {
  const [token, setToken] = useState<string>();
  const { serverURL, children } = props;
  const { i18n, t } = useTranslation(['common']);

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
          localStorage.getItem('token');
          headers = {
            authorization: `Bearer ${localStorage.getItem('token')}`,
          };
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
                if (e.response.data.message === 'jwt expired') {
                  localStorage.removeItem('token');
                  window.location.reload();
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
    (path: string, config?: AxiosRequestConfig) => {
      return send('get', path, undefined, config);
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

  const removeToken = (tkn?: string) => {
    if (tkn) {
      const { exp } = jwt_decode(tkn) as any;
      if (Date.now() > exp * 1000) {
        localStorage.setItem('token', '');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        localStorage.removeItem('companyId');
        localStorage.removeItem('companyRole');
      } else {
        const diff = exp * 1000 - Date.now();
        setTimeout(() => {
          setToken(undefined);
          localStorage.setItem('token', '');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userId');
          localStorage.removeItem('companyId');
          localStorage.removeItem('companyRole');
        }, diff);
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
        connection: { post, put, get, patch, delete: del, updateToken, token, removeToken },
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
