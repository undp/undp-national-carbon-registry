import { useTranslation } from "react-i18next";
import ReportingComponent from "../../Components/Reporting/ReportingComponent";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";

const Reports = () => {
  const { i18n } = useTranslation(["common", "reporting"]);

  const { get, post } = useConnection();
  
  return <ReportingComponent translator={i18n} />
};

export default Reports;