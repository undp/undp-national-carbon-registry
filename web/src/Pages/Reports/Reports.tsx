import { useTranslation } from "react-i18next";
import ReportingComponent from "../../Components/Reporting/ReportingComponent";

const Reports = () => {
  const { i18n } = useTranslation(["common", "reporting"]);

  return <ReportingComponent translator={i18n} />
};

export default Reports;