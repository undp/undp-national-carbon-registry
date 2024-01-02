import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    backend: {
      // translation file path
      loadPath: '/locales/i18n/{{ns}}/{{lng}}.json',
    },
    //NOTE - Uncomment to reset the language to english once the user coming back again
    // lng: 'en',
    fallbackLng: 'en',
    //NOTE - Disabled in production
    debug: true,
    //separate name spaces for each pages
    ns: [
      'common',
      'login',
      'dashboard',
      'nav',
      'company',
      'user',
      'programme',
      'view',
      'homepage',
      'ndcAction',
      'coBenifits',
      'environment',
      'genderParity',
      'safeguards',
      'social',
      'economic',
      'creditTransfer',
      'addProgramme',
      'socialEnvironmentalRisk',
    ],
  });
export default i18n;
