export const requiredValidationRule = (t: any) => {
  return {
    required: true,
    message: `${t('validationReport:required')}`,
  };
};
