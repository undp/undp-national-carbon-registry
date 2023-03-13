export default () => ({
    stage: process.env.STAGE || 'local',
    systemCountry: process.env.systemCountryCode || 'NG',
    systemCountryName: process.env.systemCountryName || 'Antarctic Region',
    defaultCreditUnit: process.env.defaultCreditUnit || 'ITMO',
    dateTimeFormat: 'DD LLLL yyyy @ HH:mm',
    dateFormat: 'DD LLLL yyyy',
    database: {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        username: process.env.DB_USER || 'hquser',
        password: process.env.DB_PASSWORD || '',
        database: (process.env.DB_NAME || 'carbondev'),
        synchronize: process.env.NODE_ENV == 'prod' ? true : true,
        autoLoadEntities: true,
        logging: ["error"]
    },
    jwt: {
        userSecret: process.env.USER_JWT_SECRET || '1324',
        adminSecret: process.env.ADMIN_JWT_SECRET || '8654',
    },
    ledger: {
        name: 'carbon-registry-' + (process.env.NODE_ENV || 'dev'),
        table: 'programmes',
        overallTable: 'overall',
        companyTable: 'company'
    },
    email: {
        source: process.env.SOURCE_EMAIL || 'info@xeptagon.com',
        endpoint: process.env.EMAIL_ENDPOINT || 'vpce-02cef9e74f152b675-b00ybiai.email-smtp.us-east-1.vpce.amazonaws.com',
        username: process.env.EMAIL_USERNAME || 'AKIAUMXKTXDJIOFY2QXL',
        password: process.env.SES_PASSWORD,
        skipSuffix: '@xeptagon.com',
        disabled: process.env.IS_EMAIL_DISABLED === 'true' ? true : false
    },
    s3CommonBucket: {
        name: 'carbon-common-'+ (process.env.NODE_ENV || 'dev'),
    },
    host: process.env.HOST || 'https://test.carbreg.org',
    liveChat : 'https://undp2020cdo.typeform.com/to/emSWOmDo',
    mapbox: {
        key: process.env.MAPBOX_PK
    },
    openstreet: {
        retrieve: process.env.OPENSTREET_QUERY === 'true' || false
    }
});