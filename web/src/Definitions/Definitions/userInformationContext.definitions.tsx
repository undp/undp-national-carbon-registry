export type UserProps = {
  id: number;
  userRole: string;
  companyId: number;
  companyRole: string;
  companyLogo: string;
  companyName: string;
  companyState: number;
  name: string;
};

export interface UserContextProps {
  userInfoState?: UserProps;
  setUserInfo: (val: UserProps) => void;
  removeUserInfo: () => void;
  IsAuthenticated: (tkn?: any) => boolean;
  isTokenExpired: boolean;
  setIsTokenExpired: (val: boolean) => void;
}
