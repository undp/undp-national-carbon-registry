import { Select } from 'antd';
import i18n from '../Internationalization/i18n';
import './languageSelection.scss';

const LanguageSelection = () => {
  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="login-language-selection-container mg-left-1">
      <span className="login-language-selection-txt">
        <Select
          placeholder="Search to Select"
          popupClassName="login-language-selection"
          defaultValue={
            localStorage.getItem('i18nextLng') !== null ? localStorage.getItem('i18nextLng') : 'en'
          }
          placement="topRight"
          onChange={(lan: string) => handleLanguageChange(lan)}
          optionFilterProp="children"
          filterOption={(input, option) => (option?.label ?? '').includes(input)}
          filterSort={(optionA, optionB) =>
            (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
          }
          options={[
            {
              value: 'en',
              label: 'English',
            },
            {
              value: 'es',
              label: 'Español',
            },
            {
              value: 'fr',
              label: 'Français',
            },
          ]}
        />
      </span>
    </div>
  );
};

export default LanguageSelection;
