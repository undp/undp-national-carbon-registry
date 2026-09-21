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
    // i18next escapes interpolated values by default (its own XSS
    // safety net, independent of React) — which HTML-entity-encodes
    // anything containing `/`, `<`, `>`, `&`, quotes, etc. A localized
    // date like "9/18/2026, 5:24:21 PM" interpolated into a string
    // comes out as "9&#x2F;18&#x2F;2026, ..." because of it. React
    // already escapes text nodes on render, so this second layer is
    // both redundant and the actual cause of the garbled output —
    // official react-i18next guidance is to disable it.
    interpolation: {
      escapeValue: false,
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
      'unfcccSdTool',
    ],
  });
export default i18n;
