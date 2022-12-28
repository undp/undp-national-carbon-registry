export interface ProgrammeDeveloperCreation {
  companyName?: string;
  companyLocation?: string;
  industry?: string;
  registrationNo?: string;
}
export interface UserCreationProps extends ProgrammeDeveloperCreation {
  name: string;
  email: string;
  role: string;
  city: string;
  zipCode: string;
  state: string;
  country: string;
  contactNo: string;
  companyLogo?: string;
}
export interface CountrySelect {
  key: string;
  label: string;
  value: string;
}
