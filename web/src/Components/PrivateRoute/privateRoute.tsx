import React from 'react';
import { useLocation, Outlet, Navigate } from 'react-router-dom';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { ROUTES } from '../../Config/uiRoutingConfig';

const PrivateRoute = () => {
  const { IsAuthenticated } = useUserContext();
  const location = useLocation();
  return IsAuthenticated() ? (
    <Outlet />
  ) : (
    <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  );
};

export default PrivateRoute;
