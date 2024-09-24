import { AxiosRequestConfig, AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios';

import { ReactNode } from 'react';

export type Methods = 'get' | 'post' | 'delete' | 'put' | 'patch';

export type ConnectionContextProviderProps = {
  serverURL: string;
  t: any;
  statServerUrl?: string;
  children: ReactNode;
};

export interface Response<T> {
  data: T;
  statusText: string;
  status?: number;
  headers: RawAxiosResponseHeaders | AxiosResponseHeaders;
  config?: AxiosRequestConfig;
  request?: any;
  message: string;
}

export type ConnectionProps = {
  post<T = any, R = Response<T>>(
    path: string,
    data?: any,
    config?: AxiosRequestConfig,
    extraUrl?: string
  ): Promise<R>;
  get<T = any, R = Response<T>>(
    path: string,
    config?: AxiosRequestConfig,
    extraUrl?: string
  ): Promise<R>;
  delete<T = any, R = Response<T>>(path: string, config?: AxiosRequestConfig): Promise<R>;
  put<T = any, R = Response<T>>(path: string, data?: any, config?: AxiosRequestConfig): Promise<R>;
  patch<T = any, R = Response<T>>(
    path: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<R>;
  updateToken: (token?: string) => void;
  updateRefreshToken: (refreshToken?: string) => void;
  token?: string;
  refreshToken?: string;
  removeToken: (tkn?: string) => void;
  statServerUrl?: string;
};
