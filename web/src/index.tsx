import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// import './Components/Internationalization/i18n';
import { i18n } from '@undp/carbon-library';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
