import { Outlet, Navigate } from "react-router-dom";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { ROUTES } from "../../Config/uiRoutingConfig";

interface RoleRouteProps {
  /** Company roles allowed through this route. A user whose companyRole
   * isn't listed is redirected to `redirectTo`. */
  allow: CompanyRole[];
  redirectTo?: string;
}

/**
 * Company-role guard for a nested route group, mirroring PrivateRoute (which
 * only checks authentication). Sits inside PrivateRoute — auth is already
 * guaranteed — and renders its children (`<Outlet />`) only when the current
 * user's companyRole is in `allow`, otherwise redirects. companyRole is
 * hydrated synchronously from localStorage on load, so a refresh directly on
 * a guarded URL doesn't flash-then-redirect.
 */
const RoleRoute = ({ allow, redirectTo = ROUTES.DASHBOARD }: RoleRouteProps) => {
  const { userInfoState } = useUserContext();
  const role = userInfoState?.companyRole as CompanyRole | undefined;
  return role && allow.includes(role) ? <Outlet /> : <Navigate to={redirectTo} replace />;
};

export default RoleRoute;
