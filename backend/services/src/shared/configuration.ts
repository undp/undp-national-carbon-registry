export default () => ({
  stage: process.env.STAGE || "local",
  systemCountry: process.env.systemCountryCode || "NG",
  systemCountryName: process.env.systemCountryName || "Antarctic Region",
  defaultCreditUnit: process.env.defaultCreditUnit || "ITMO",
  dateTimeFormat: "DD LLLL yyyy @ HH:mm",
  dateFormat: "DD LLLL yyyy",
  database: {
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER || "hquser",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "carbondev",
    synchronize: process.env.NODE_ENV == "prod" ? true : true,
    autoLoadEntities: true,
    logging: ["error"],
  },
  jwt: {
    expiresIn: process.env.EXPIRES_IN || "7200",
    userSecret: process.env.USER_JWT_SECRET || "1324",
    adminSecret: process.env.ADMIN_JWT_SECRET || "8654",
  },
  ledger: {
    name: "carbon-registry-" + (process.env.NODE_ENV || "dev"),
    table: "programmes",
    overallTable: "overall",
    companyTable: "company",
  },
  email: {
    source: process.env.SOURCE_EMAIL || "info@xeptagon.com",
    endpoint:
      process.env.SMTP_ENDPOINT ||
      "vpce-02cef9e74f152b675-b00ybiai.email-smtp.us-east-1.vpce.amazonaws.com",
    username: process.env.SMTP_USERNAME || "AKIAUMXKTXDJIOFY2QXL",
    password: process.env.SMTP_PASSWORD,
    disabled: process.env.IS_EMAIL_DISABLED === "true" ? true : false,
    disableLowPriorityEmails:
      process.env.DISABLE_LOW_PRIORITY_EMAIL === "true" ? true : false,
  },
  s3CommonBucket: {
    name: "carbon-common-" + (process.env.NODE_ENV || "dev"),
  },
  host: process.env.HOST || "https://test.carbreg.org",
  liveChat: "https://undp2020cdo.typeform.com/to/emSWOmDo",
  mapbox: {
    key: process.env.MAPBOX_PK,
  },
  openstreet: {
    retrieve: process.env.OPENSTREET_QUERY === "true" || false,
  },
  asyncQueueName:
    process.env.ASYNC_QUEUE_NAME ||
    "https://sqs.us-east-1.amazonaws.com/302213478610/AsyncQueuedev.fifo",
  ITMOSystem: {
    endpoint:
      process.env.ITMO_ENDPOINT ||
      "https://dev-digital-carbon-finance-webapp-api-rxloyxnj3dbso.azurewebsites.net/api/v1/",
    apiKey: process.env.ITMO_API_KEY,
    email: process.env.ITMO_EMAIL,
    password: process.env.ITMO_PASSWORD,
  },
});
