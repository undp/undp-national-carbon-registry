import React from 'react';
import ValidationAgreement from '../../Components/ValidationAgreement/ValidationAgreement';
import { useTranslation } from 'react-i18next';

const ValidationAgreementPage = () => {
  const { i18n } = useTranslation(['common', 'validationAgreement']);
  return <ValidationAgreement translator={i18n} />;
};

export default ValidationAgreementPage;
