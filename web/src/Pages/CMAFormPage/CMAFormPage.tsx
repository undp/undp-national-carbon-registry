import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import CMAForm from '../../Components/CMAForm/CMAForm';

const CMAFormPage = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation(['common', 'CMAForm']);
  return <CMAForm translator={i18n} />;
};

export default CMAFormPage;
