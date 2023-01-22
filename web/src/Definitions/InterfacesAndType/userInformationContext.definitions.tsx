export type UserProps = {
  id: string;
  userRole: string;
  companyId: number;
  companyRole: string;
  companyLogo: string;
  companyState: number;
};

export interface UserContextProps {
  userInfoState?: UserProps;
  setUserInfo: (val: UserProps) => void;
  removeUserInfo: () => void;
  IsAuthenticated: () => boolean;
}
