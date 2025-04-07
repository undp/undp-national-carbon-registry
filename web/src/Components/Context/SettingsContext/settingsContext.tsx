import React, { createContext, useContext, useState } from 'react';

export const SettingsContext = createContext({
  isTransferFrozen: false,
  setTransferFrozen: (value: boolean) => {},
});

export const SettingsContextProvider = ({ children }: React.PropsWithChildren) => {
  const [isTransferFrozen, setIsTransferFrozen] = useState(false);

  const setTransferFrozen = (value: boolean) => {
    setIsTransferFrozen(value);
  };

  return (
    <SettingsContext.Provider
      value={{
        isTransferFrozen,
        setTransferFrozen,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  return useContext(SettingsContext);
};
