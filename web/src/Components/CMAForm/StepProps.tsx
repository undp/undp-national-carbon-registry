import { i18n } from "i18next";

export interface CustomStepsProps {
  next?: () => void,
  prev?: () => void,
  form: any,
  current: number,
  countries?: string[]
  t: any
}
