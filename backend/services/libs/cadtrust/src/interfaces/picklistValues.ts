/**
 * Snapshot of `GET /v2/governance/meta/pickList`, fetched 2026-08-20 against a live CAD Trust node.
 *
 * CAD Trust's Technical Committee governs and can change these values over time — this file is a
 * compile-time aid, not a runtime guarantee. `CadTrustPicklistService.warnOnUnknownValues`
 * (`libs/shared/src/cadtrust-sync/cadtrust-picklist.service.ts`) remains the runtime authority for
 * drift after this snapshot ages; re-fetch and regenerate this file periodically rather than trusting
 * it indefinitely.
 *
 * Only the picklist keys the registry-side adaptor (`libs/shared/src/cadtrust-sync`) actually reads
 * are typed here. CAD Trust publishes more keys than this (`verificationBody`, `ratingType`,
 * `labelType`, `coBenefitId`, `unitStatus`, `unitType`, `locationMapType`,
 * `aefT2AuthorizationsSector`, ...) — add a union for one only once something maps to it, so an
 * unused type can't silently drift out of date.
 */

export const PROJECT_SECTOR_VALUES = [
  'Afforestation and reforestation',
  'Agriculture',
  'Any combination of the above',
  'Carbon capture and storage',
  'Chemical industries',
  'Construction',
  'Energy demand',
  'Energy distribution',
  'Energy industries (renewable-/ non renewable sources)',
  'Fugitive emissions from fuel (solid, oil and gas)',
  'Fugitive emissions from the production and consumption of halocarbons and sulfur hexafluoride',
  'Livestock and manure management',
  'Manufacturing industries',
  'Metal production',
  'Mining/mineral production',
  'Others',
  'Solvent use',
  'Transport',
  'Urban Development',
  'Waste handling and disposal',
] as const;
export type ProjectSectorValue = (typeof PROJECT_SECTOR_VALUES)[number];

export const PROJECT_TYPE_VALUES = [
  'Afforestation',
  'Agriculture',
  'Agriculture, forestry and other land use (AFOLU)',
  'Any combination of the above',
  'Biogas',
  'Biomass Energy',
  'CO2 usage',
  'Cement',
  'Coal bed/mine methane',
  'Energy Efficiency Industry',
  'Energy Efficiency households',
  'Energy Efficiency own generation',
  'Energy Efficiency service',
  'Energy Efficiency supply side',
  'Energy distribution',
  'Fugitive',
  'Geothermal',
  'Hydro',
  'Landfill gas',
  'Methane avoidance',
  'N2O',
  'PFCs and SF6',
  'Reforestation',
  'Solar',
  'Tidal',
  'Transport',
  'Waste',
  'Wind',
] as const;
export type ProjectTypeValue = (typeof PROJECT_TYPE_VALUES)[number];

export const PROJECT_STATUS_VALUES = [
  'Authorized',
  'Certified',
  'Completed',
  'Inactive',
  'Listed',
  'Registered',
  'Rejected',
  'Validated',
  'Verified',
  'Withdrawn',
] as const;
export type ProjectStatusValue = (typeof PROJECT_STATUS_VALUES)[number];

export const UNIT_METRIC_VALUES = ['gCO2eq/kWh', 'kt (Kiloton)', 'tCO2e'] as const;
export type UnitMetricValue = (typeof UNIT_METRIC_VALUES)[number];

export const METHODOLOGY_TYPE_VALUES = [
  'Avoidance - nature',
  'Avoidance - technical',
  'Not Determined',
  'Reduction - nature',
  'Reduction - technical',
  'Removal - nature',
  'Removal - technical',
] as const;
export type MethodologyTypeValue = (typeof METHODOLOGY_TYPE_VALUES)[number];

export const STAKEHOLDER_TYPE_VALUES = ['Consultant', 'Developer', 'Owner'] as const;
export type StakeholderTypeValue = (typeof STAKEHOLDER_TYPE_VALUES)[number];

export const LOCATION_COUNTRY_VALUES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Anguilla', 'Antarctica',
  'Antigua and Barbuda', 'Argentina', 'Armenia', 'Aruba', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin',
  'Bermuda', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil',
  'British Indian Ocean Territory', 'Brunei Darussalam', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile',
  'China', 'Christmas Island', 'Colombia', 'Cocos (Keeling) Islands',
  'Commonwealth of Independent States', 'Comoros', 'Congo', 'Cook Islands', 'Costa Rica',
  "Cote d'Ivoire", 'Croatia', 'Cuba', 'Curacao', 'Cyprus', 'Czech Republic',
  "Democratic People's Republic of Korea", 'Democratic Republic of Congo', 'Denmark', 'Djibouti',
  'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial New Guinea',
  'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'European Union',
  'Falkland Islands (Malvinas)', 'Faroe Islands', 'Fiji', 'Finland', 'France', 'French Guiana',
  'French Polynesia', 'French Southern Territories', 'Gabon', 'Gambia', 'Georgia', 'Germany',
  'Ghana', 'Gibraltar', 'Greece', 'Greenland', 'Grenada', 'Guadeloupe', 'Guam', 'Guatemala',
  'Guernsey', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Heard Island and Mcdonald Islands',
  'Holy See', 'Honduras', 'Hong Kong S.A.R.', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran',
  'Iraq', 'Ireland', 'Isle of Man', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jersey, C.I.',
  'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan',
  "Lao People's Democratic Republic", 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya',
  'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macau S.A.R.', 'Madagascar', 'Malawi', 'Malaysia',
  'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Martinique', 'Mauritania', 'Mauritius',
  'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Montserrat', 'Morocco',
  'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'Netherlands Antilles',
  'New Caledonia', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'Niue', 'Norfolk Island',
  'North Macedonia', 'Northern Mariana Islands', 'Norway', 'Not Specified', 'Oman', 'Pakistan',
  'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Pitcairn', 'Poland',
  'Portugal', 'Puerto Rico', 'Qatar', 'Republic of Korea', 'Republic of Moldova', 'Romania',
  'Russian Federation', 'Rwanda', 's. Georgia and S. Sandwich Islands', 'Samoa', 'San Marino',
  'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone',
  'Singapore', 'Slovak Republic', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
  'South Sudan', 'Spain', 'Sri Lanka', 'St. Helena', 'St. Kitts and Nevis', 'St. Lucia',
  'St. Maarten', 'St. Pierre & Miquelon', 'St. Vincent and the Grenadines', 'State of Palestine',
  'Stateless', 'Sudan', 'Suriname', 'Svalbard and Jan Mayen', 'Swaziland', 'Sweden',
  'Switzerland', 'Syria', 'Syria Arab Reoublic', 'Taiwan', 'Tajikistan', 'Thailand',
  'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
  'Turks and Caicos Islands', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates',
  'United Kingdom', 'United Republic of Tanzania', 'United States Minor Outlying Islands',
  'United States of America', 'Uruguay', 'Uzbekistan', 'Vanuatu',
  'Venezuela (Bolivarian Republic of)', 'Viet Nam', 'Virgin Islands, British',
  'Virgin Islands, US', 'Wallis and Futuna', 'West Bank and Gaza', 'Western Sahara', 'Yemen',
  'Zambia', 'Zimbabwe',
] as const;
export type LocationCountryValue = (typeof LOCATION_COUNTRY_VALUES)[number];

export const VALIDATION_TYPE_VALUES = [
  'Validation of Post Registration Change',
  'Validation of Project Design Document',
  'Validation of Renewal of Credit Period',
] as const;
export type ValidationTypeValue = (typeof VALIDATION_TYPE_VALUES)[number];

// `validationBody` is deliberately NOT typed as a closed union here, unlike every other picklist in
// this file. The real list (~90 names: "Bureau Veritas Certification Holding SAS (BVCH)", "DNV",
// "SGS (Thailand) Limited", "TÜV Nord Cert GmbH", ...) is a closed, international VVB-accreditation
// registry. A national Independent Certifier in a UNDP National Carbon Registry deployment will
// essentially never appear in it by name — typing this as a union would turn every real validation
// sync into a compile error, which is strictly worse than the existing warn-only runtime check.
// Left as `string` on `ValidationCreateInput` on purpose; do not "fix" this into a union later.
