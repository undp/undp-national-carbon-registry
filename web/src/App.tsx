import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ConnectionContextProvider } from './Context/ConnectionContext/connectionContext';
import 'antd/dist/antd.css';
import './Styles/app.scss';
import { UserInformationContextProvider } from './Context/UserInformationContext/userInformationContext';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AbilityContext } from './Casl/Can';
import { defineAbility, updateUserAbility } from './Casl/ability';

const Login = React.lazy(() => import('./Pages/Login/login'));
const SignUp = React.lazy(() => import('./Pages/Signup/signup'));
const CustomLayout = React.lazy(() => import('./Components/Layout/layout'));
const AddUser = React.lazy(() => import('./Pages/AddUser/addUser'));
const UserManagement = React.lazy(() => import('./Pages/UserManagement/userManagement'));
const Dashboard = React.lazy(() => import('./Pages/Dashboard/dashboard'));
const AddNewCompany = React.lazy(() => import('./Pages/Company/addNewCompany'));
const CompanyManagement = React.lazy(() => import('./Pages/CompanyManagement/companyManagement'));
const ProgrammeManagement = React.lazy(
  () => import('./Pages/ProgrammeManagement/programmeManagement')
);
const ProgrammeView = React.lazy(() => import('./Pages/ProgrammeView/programmeView'));
const CreditTransfers = React.lazy(() => import('./Pages/Transfers/creditTransfers'));
const Homepage = React.lazy(() => import('./Pages/Homepage/homepage'));
const PrivacyPolicy = React.lazy(() => import('./Pages/PrivacyPolicy/privacyPolicy'));
const CodeOfConduct = React.lazy(() => import('./Pages/CodeofConduct/codeofConduct'));
const CookiePolicy = React.lazy(() => import('./Pages/CookiePolicy/cookiePolicy'));
const PrivateRoute = React.lazy(() => import('./Components/PrivateRoute/privateRoute'));
const TermsOfUse = React.lazy(() => import('./Pages/TermsofUse/termsofUse'));
const UserProfile = React.lazy(() => import('./Pages/UserProfile/UserProfile'));
const CompanyProfile = React.lazy(() => import('./Pages/CompanyProfile/companyProfile'));

const App = () => {
  const ability = defineAbility();
  useEffect(() => {
    console.log(process.env.REACT_APP_BACKEND);
    if (
      localStorage.getItem('companyId') &&
      localStorage.getItem('userRole') &&
      localStorage.getItem('userId') &&
      localStorage.getItem('companyState') &&
      localStorage.getItem('companyRole')
    )
      updateUserAbility(ability, {
        id: parseInt(localStorage.getItem('userId') as string),
        role: localStorage.getItem('userRole') as string,
        companyId: parseInt(localStorage.getItem('companyId') as string),
        companyState: parseInt(localStorage.getItem('companyState') as string),
        companyRole: localStorage.getItem('companyRole') as string,
      });
  }, []);
  return (
    <AbilityContext.Provider value={ability}>
      <ConnectionContextProvider
        serverURL={
          process.env.REACT_APP_BACKEND
            ? process.env.REACT_APP_BACKEND
            : 'https://ck5kt5uaw1.execute-api.us-east-1.amazonaws.com/dev'
        }
      >
        <UserInformationContextProvider>
          <BrowserRouter>
            <Routes>
              <Route path="login" element={<Login />} />
              <Route path="signUp" element={<SignUp />} />
              <Route path="privacy" element={<PrivacyPolicy />} />
              <Route path="codeconduct" element={<CodeOfConduct />} />
              <Route path="cookie" element={<CookiePolicy />} />
              <Route path="terms" element={<TermsOfUse />} />
              <Route path="/" element={<Homepage />} />
              <Route path="/" element={<PrivateRoute />}>
                <Route path="/dashboard" element={<CustomLayout selectedKey="dashboard" />}>
                  <Route index element={<Dashboard />} />
                </Route>
                <Route
                  path="/programmeManagement"
                  element={<CustomLayout selectedKey="programmeManagement/viewAll" />}
                >
                  <Route path="viewAll" element={<ProgrammeManagement />} />
                  <Route path="view" element={<ProgrammeView />} />
                </Route>
                <Route
                  path="/companyManagement"
                  element={<CustomLayout selectedKey="companyManagement/viewAll" />}
                >
                  <Route path="viewAll" element={<CompanyManagement />} />
                  <Route path="addCompany" element={<AddNewCompany />} />
                  <Route path="updateCompany" element={<AddNewCompany />} />
                </Route>
                <Route
                  path="/userManagement"
                  element={<CustomLayout selectedKey="userManagement/viewAll" />}
                >
                  <Route path="viewAll" element={<UserManagement />} />
                  <Route path="addUser" element={<AddUser />} />
                  <Route path="updateUser" element={<AddUser />} />
                </Route>
                <Route
                  path="/creditTransfers"
                  element={<CustomLayout selectedKey="creditTransfers/viewAll" />}
                >
                  <Route path="viewAll" element={<CreditTransfers />} />
                  {/* <Route path="view" element={<ProgrammeView />} /> */}
                </Route>
                <Route
                  path="/userProfile"
                  element={<CustomLayout selectedKey="userManagement/viewAll" />}
                >
                  <Route path="view" element={<UserProfile />} />
                </Route>
                <Route
                  path="/companyProfile"
                  element={<CustomLayout selectedKey="companyManagement/viewAll" />}
                >
                  <Route path="view" element={<CompanyProfile />} />
                </Route>
                {/* <Route
                    path="/userManagement"
                    element={<CustomLayout selectedKey="userManagement" />}
                  >
                    <Route index element={<UserManagement />} />
                    <Route path="addUser" element={<AddUser />} />
                    <Route path="updateUser" element={<UpdateUser />} />
                  </Route> */}
              </Route>
              <Route path="/*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </UserInformationContextProvider>
      </ConnectionContextProvider>
    </AbilityContext.Provider>
  );
};

export default App;
