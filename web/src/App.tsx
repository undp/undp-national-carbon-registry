import { Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "antd/dist/antd.css";
import "./Styles/app.scss";
import Login from "./Pages/Login/login";
import PrivateRoute from "./Components/PrivateRoute/privateRoute";
import SignUp from "./Pages/Signup/signup";
import CustomLayout from "./Components/Layout/layout";
import AddUser from "./Pages/AddUser/addUser";
import UserManagement from "./Pages/UserManagement/userManagement";
// import RegistryDashboard from "./Pages/Dashboard/registry/registrydashboard";
import AddNewCompany from "./Pages/Company/addNewCompany";
import CompanyManagement from "./Pages/CompanyManagement/companyManagement";
// import ProgrammeManagement from './Pages/Old_ProgrammeManagement/programmeManagement';
import "mapbox-gl/dist/mapbox-gl.css";
import Homepage from "./Pages/Homepage/homepage";
import PrivacyPolicy from "./Pages/PrivacyPolicy/privacyPolicy";
import CodeOfConduct from "./Pages/CodeofConduct/codeofConduct";
import CookiePolicy from "./Pages/CookiePolicy/cookiePolicy";
import TermsOfUse from "./Pages/TermsofUse/termsofUse";
import CarbonHelp from "./Pages/Help/help";
import UserProfile from "./Pages/UserProfile/UserProfile";
import CompanyProfile from "./Pages/CompanyProfile/companyProfile";
import { AbilityContext } from "./Casl/Can";
import { defineAbility, updateUserAbility } from "./Casl/ability";

import RegisterNewCompany from "./Pages/Company/registerNewCompany";
import { useTranslation } from "react-i18next";
import { ConnectionContextProvider } from "./Context/ConnectionContext/connectionContext";
import { UserInformationContextProvider } from "./Context/UserInformationContext/userInformationContext";
import { SettingsContextProvider } from "./Context/SettingsContext/settingsContext";
import { Loading } from "./Components/Loading/loading";
// import ProgrammeManagement from './Pages/ProgrammeManagement/ProgrammeManagement';
// import AddProgramme from './Pages/ProgrammeManagement/AddProgramme';
import MonitoringReport from "./Pages/MonitoringReport/MonitoringReport";
import ProjectDetailsView from "./Pages/ProgrammeManagement/ProjectDetailsView";
import PDDFormPage from "./Pages/PDD/PDDPage";
import ValidationReportPage from "./Pages/ValidationReportPage.tsx/ValidationReportPage";
import VerificationReport from "./Pages/ProgrammeManagement/VerificationReport";
import Settings from "./Pages/Settings/settings";
import SLCFDashboard from "./Pages/Dashboard/slcf/Dashboard";
import AddProgramme from "./Pages/ProgrammeManagement/addProgramme";
import ProgrammeManagement from "./Pages/ProgrammeManagement/programmeManagement";
import { CreditBalancePage } from "./Pages/CreditPages/creditBalancePage";
import { CreditTransfersPage } from "./Pages/CreditPages/creditTransfersPage";
import { CreditRetirementsPage } from "./Pages/CreditPages/creditRetirementsPage";
import Reports from "./Pages/Reports/Reports";

const App = () => {
  const { t } = useTranslation(["common"]);
  const ability = defineAbility();
  const enableRegistration =
    import.meta.env.VITE_APP_ENABLE_REGISTRATION || "true";

  if (
    localStorage.getItem("companyId") &&
    localStorage.getItem("userRole") &&
    localStorage.getItem("userId") &&
    localStorage.getItem("companyState") &&
    localStorage.getItem("companyRole")
  ) {
    updateUserAbility(ability, {
      id: parseInt(localStorage.getItem("userId") as string),
      role: localStorage.getItem("userRole") as string,
      companyId: parseInt(localStorage.getItem("companyId") as string),
      companyState: parseInt(localStorage.getItem("companyState") as string),
      companyRole: localStorage.getItem("companyRole") as string,
    });
  }

  return (
    <AbilityContext.Provider value={ability}>
      <ConnectionContextProvider
        serverURL={
          import.meta.env.VITE_APP_BACKEND
            ? import.meta.env.VITE_APP_BACKEND
            : "http://localhost:3000"
        }
        t={t}
        statServerUrl={
          import.meta.env.VITE_APP_STAT_URL
            ? import.meta.env.VITE_APP_STAT_URL
            : "http://localhost:3100"
        }
      >
        <UserInformationContextProvider>
          <SettingsContextProvider>
            <BrowserRouter>
              <Routes>
                <Route path="login" element={<Login />} />
                <Route
                  path="forgotPassword"
                  element={<Login forgotPassword={true} />}
                />
                <Route
                  path="resetPassword/:requestid"
                  element={<Login resetPassword={true} />}
                />
                <Route path="signUp" element={<SignUp />} />
                <Route path="privacy" element={<PrivacyPolicy />} />
                <Route path="help" element={<CarbonHelp />} />
                <Route path="codeconduct" element={<CodeOfConduct />} />
                <Route path="cookie" element={<CookiePolicy />} />
                <Route path="terms" element={<TermsOfUse />} />
                <Route path="/" element={<Homepage />} />
                <Route path="/" element={<PrivateRoute />}>
                  <Route
                    path="/dashboard"
                    element={<CustomLayout selectedKey="dashboard" />}
                  >
                    <Route path="/dashboard" element={<SLCFDashboard />} />
                  </Route>

                  <Route
                    path="/programmeManagement"
                    element={
                      <CustomLayout selectedKey="programmeManagement/viewAll" />
                    }
                  >
                    <Route path="viewAll" element={<ProgrammeManagement />} />
                    <Route
                      path="viewAllProjects"
                      element={<ProgrammeManagement />}
                    />
                    <Route path="view/:id" element={<ProjectDetailsView />} />
                    <Route path="addProgramme" element={<AddProgramme />} />
                    <Route path="addProgramme/:id" element={<AddProgramme />} />
                    <Route
                      path="monitoringReport/:id"
                      element={<MonitoringReport />}
                    />
                    {/* <Route
                      path="monitoringReport/:id/:verificationRequestId"
                      element={<MonitoringReport />}
                    /> */}
                    <Route
                      path="verificationReport/:id"
                      element={<VerificationReport />}
                    />
                    <Route
                      path="verificationReport/:id/:verificationRequestId"
                      element={<VerificationReport />}
                    />
                    <Route path="pdd/:id/" element={<PDDFormPage />} />
                    <Route
                      path="validationReport/:id"
                      element={<ValidationReportPage />}
                    />
                  </Route>
                  <Route path="/credits" element={<CustomLayout />}>
                    <Route path="balance" element={<CreditBalancePage />} />
                    <Route path="transfers" element={<CreditTransfersPage />} />
                    <Route
                      path="retirements"
                      element={<CreditRetirementsPage />}
                    />
                  </Route>
                  <Route
                    path="/companyManagement"
                    element={
                      <CustomLayout selectedKey="companyManagement/viewAll" />
                    }
                  >
                    <Route path="viewAll" element={<CompanyManagement />} />
                    <Route path="addCompany" element={<AddNewCompany />} />
                    <Route path="updateCompany" element={<AddNewCompany />} />
                  </Route>
                  <Route
                    path="/userManagement"
                    element={
                      <CustomLayout selectedKey="userManagement/viewAll" />
                    }
                  >
                    <Route path="viewAll" element={<UserManagement />} />
                    <Route path="addUser" element={<AddUser />} />
                    <Route path="updateUser" element={<AddUser />} />
                  </Route>
                  <Route
                    path="/userProfile"
                    element={
                      <CustomLayout selectedKey="userManagement/viewAll" />
                    }
                  >
                    <Route path="view" element={<UserProfile />} />
                  </Route>
                  <Route
                    path="/reports"
                    element={<CustomLayout selectedKey="reports" />}
                  >
                    <Route path="" element={<Reports />} />
                  </Route>
                  <Route
                    path="/companyProfile"
                    element={
                      <CustomLayout selectedKey="companyManagement/viewAll" />
                    }
                  >
                    <Route path="view" element={<CompanyProfile />} />
                  </Route>
                  <Route
                    path="/settings"
                    element={<CustomLayout selectedKey="settings" />}
                  >
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                </Route>
                {enableRegistration === "true" && (
                  <Route
                    path="registerCompany"
                    element={
                      <Suspense fallback={<Loading />}>
                        <RegisterNewCompany />
                      </Suspense>
                    }
                  />
                )}
                <Route path="/*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </SettingsContextProvider>
        </UserInformationContextProvider>
      </ConnectionContextProvider>
    </AbilityContext.Provider>
  );
};

export default App;
