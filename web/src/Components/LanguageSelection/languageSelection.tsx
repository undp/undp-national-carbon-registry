import React, { FC } from 'react';
import { Select } from 'antd';
import './languageSelection.scss';

export interface LanguageSelectionProps {
  i18n: any;
}

const LanguageSelection: FC<LanguageSelectionProps> = (props: LanguageSelectionProps) => {
  const { i18n } = props;
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
