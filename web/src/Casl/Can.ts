import { createContext } from 'react';
import { createContextualCan } from '@casl/react';
import { AppAbility } from './ability';

export const AbilityContext = createContext({} as AppAbility);
export const Can = createContextualCan(AbilityContext.Consumer);
