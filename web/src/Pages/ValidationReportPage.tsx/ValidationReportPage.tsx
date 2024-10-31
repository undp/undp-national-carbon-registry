import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ValidationReport from '../../Components/ValidationReport/ValidationReport';

const ValidationReportPage = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation(['common', 'validationReport']);
  return <ValidationReport translator={i18n} />;
};

export default ValidationReportPage;
