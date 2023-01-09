import { Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ConnectionContextProvider } from './Context/ConnectionContext/connectionContext';
import 'antd/dist/antd.css';
import './Styles/app.scss';
import Login from './Pages/Login/login';
import { UserInformationContextProvider } from './Context/UserInformationContext/userInformationContext';
import PrivateRoute from './Components/PrivateRoute/privateRoute';
import SignUp from './Pages/Signup/signup';
import CustomLayout from './Components/Layout/layout';
import AddUser from './Pages/AddUser/addUser';
import UpdateUser from './Pages/UpdateUser/updateUser';
import UserManagement from './Pages/UserManagement/userManagement';
import Dashboard from './Pages/Dashboard/dashboard';
import AddNewCompany from './Pages/Company/addNewCompany';
import CompanyManagement from './Pages/CompanyManagement/companyManagement';
import ProgrammeManagement from './Pages/ProgrammeManagement/programmeManagement';
import ProgrammeView from './Pages/ProgrammeView/programmeView';
import i18next from 'i18next';
import 'mapbox-gl/dist/mapbox-gl.css';
import Homepage from './Pages/Homepage/homepage';
import UserProfile from './Pages/UserProfile/UserProfile';

const App = () => {
  useEffect(() => {
    console.log(process.env.REACT_APP_BACKEND);
  }, []);
  return (
    <Suspense fallback="loading...">
      <ConnectionContextProvider
        serverURL={
          process.env.REACT_APP_BACKEND
            ? process.env.REACT_APP_BACKEND
            : 'http://localhost:3000/local/api'
        }
      >
        <UserInformationContextProvider>
          <BrowserRouter>
            <Routes>
              <Route path="login" element={<Login />} />
              <Route path="signUp" element={<SignUp />} />
              <Route path="/" element={<Homepage />} />
              <Route path="/" element={<PrivateRoute />}>
                <Route path="/dashboard" element={<CustomLayout selectedKey="dashboard" />}>
                  <Route index element={<Dashboard />} />
                </Route>
                <Route
                  path="/programmeManagement"
                  element={<CustomLayout selectedKey="programme" />}
                >
                  <Route path="viewAll" element={<ProgrammeManagement />} />
                  <Route path="view" element={<ProgrammeView />} />
                </Route>
                <Route path="/companyManagement" element={<CustomLayout selectedKey="company" />}>
                  <Route path="viewAll" element={<CompanyManagement />} />
                  <Route path="addCompany" element={<AddNewCompany />} />
                  <Route path="updateCompany" element={<AddNewCompany />} />
                </Route>
                <Route path="/userManagement" element={<CustomLayout selectedKey="user" />}>
                  <Route path="viewAll" element={<UserManagement />} />
                  <Route path="addUser" element={<AddUser />} />
                  <Route path="updateUser" element={<AddUser />} />
                </Route>
                <Route
                  path="/userProfile"
                  element={<CustomLayout selectedKey="userManagement/viewAll" />}
                >
                  <Route path="userProfileDetails" element={<UserProfile />} />
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
    </Suspense>
  );
};

export default App;
