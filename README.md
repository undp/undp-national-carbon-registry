![GitHub last commit](https://img.shields.io/github/last-commit/undp/carbon-registry)
![Uptime](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/undp/carbon-registry-status/master/api/carbon-registry/uptime.json)
[![](https://img.shields.io/badge/chat-SparkBlue-blue)](https://www.sparkblue.org/group/keeping-track-digital-public-goods-paris-agreement)
[![](https://img.shields.io/badge/Digital%20Public%20Good-Certified-blueviolet)](https://app.digitalpublicgoods.net/a/10403)

<a name="about"></a>

# National Carbon Credit Registry
The National Carbon Registry enables carbon credit trading in order to reduce greenhouse gas emissions.

As an online database, the National Carbon Registry uses national and international standards for quantifying and verifying greenhouse gas emissions reductions by programmes, tracking issued carbon credits and enabling credit transfers in an efficient and transparent manner. The Registry functions by receiving, processing, recording and storing data on mitigations projects, the issuance, holding, transfer, acquisition, cancellation, and retirement of emission reduction credits. This information is publicly accessible to increase public confidence in the emissions reduction agenda.

The National Carbon Registry enables carbon credit tracking transactions from mitigation activities, as the digital implementation of the Paris Agreement. Any country can customize and deploy a local version of the registry then connect it to other national & international registries, MRV systems, and more. 

The system has 3 key features:
* **Analytics Dashboard:** Enabling governments, companies, and certification bodies to operate transparently and function on an immutable blockchain.
* **Carbon Credit Calculator:** Standardized system According to the UNFCCC - CDM (Clean Development Mechanism) methodologies, across defined sectors. 
* **Serial Number Generator:** Standardizing the technical format to allow for easy cross-border collaboration between carbon trading systems.

## Index
* [About](#about)
* [Standards](#standards)
* [Architecture](#architecture)
* [Project Structure](#structure)
* [Run as Containers](#container)
* [Run Services Locally](#local)
* [Run Services on Cloud](#cloud)
* [User Onboarding](#user)
* [Web Frontend](#frontend)
* [Localization](#localization)
* [API](#api)
* [Status Page](#status)
* [Governance & Support](#support)

<a name="standards"></a>
## Standards
This codebase aims to fullfill the digital public goods standard:
https://digitalpublicgoods.net/standard/
It is built according to the Principles for Digital Development:
https://digitalprinciples.org/ 

<a name="architecture"></a>
## System Architecture
UNDP Carbon Registry is based on service oriented architecture (SOA). Following diagram visualize the basic components in the system.

![alt text](./documention/imgs/System%20Architecture.svg)

<a name="services"></a>
### **System Services**
#### *National Service*

Authenticate, Validate and Accept user (Government, Programme Developer/Certifier) API requests related to the following functionalities,
- User and company CRUD operations.
- User authentication.
- Programme life cycle management. 
- Credit life cycle management.

Service is horizontally scalable and state maintained in the following locations,
- File storage.
- Operational Database.
- Ledger Database.

Uses the Carbon Credit Calculator and Serial Number Generator node modules to estimate the programme carbon credit amount and issue a serial number.
Uses Ledger interface to persist programme and credit life cycles.

#### *Analytics Service*
Serve all the system analytics. Generate all the statistics using the operational database. 
Horizontally scalable. 

#### *Replicator Service*
Asynchronously replicate ledger database events in to the operational database. During the replication process it injects additional information to the data for query purposes (Eg: Location information). 
Currently implemented for QLDB and PostgresSQL ledgers. By implementing [replicator interface](./backend/services/src/ledger-replicator/replicator-interface.service.ts) can support more ledger replicators. 
Replicator select based on the `LEDGER_TYPE` environment variable. Support types `QLDB`, `PGSQL(Default)`.

### **Deployment**
System services can deploy in 2 ways.
- **As a Container** - Each service boundary containerized in to a docker container and can deploy on any container orchestration service. [Please refer Docker Compose file](./docker-compose.yml)
- **As a Function** - Each service boundary packaged as a function (Serverless) and host on any Function As A Service (FaaS) stack. [Please refer Serverless configuration file](./backend/services/serverless.yml)


### **External Service Providers**
All the external services access through a generic interface. It will decouple the system implementation from the external services and enable extendability to multiple services.

**Geo Location Service** 

Currently implemented for 2 options.
1. File based approach. User has to manually add the regions with the geo coordinates. [Sample File](./backend/services/regions.csv). To apply new file changes, replicator service needs to restart. 
2. [Mapbox](https://mapbox.com). Dynamically query geo coordinates from the Mapbox API. 

Can add more options by implementing [location interface](./backend/services/src/shared/location/location.interface.ts)

Change by environment variable `LOCATION_SERVICE`. Supported types `MAPBOX`, `FILE(Default)`

**File Service**

Implemented 2 options for static file hosting.
1. NestJS static file hosting using the local storage and container volumes.
2. AWS S3 file storage.

Can add more options by implementing [file handler interface](./backend/services/src/shared/file-handler/filehandler.interface.ts)

Change by environment variable `FILE_SERVICE`. Supported types `S3`, `LOCAL(Default)`

### **Database Architecture**
Primary/secondary database architecture used to store carbon programme and account balances. 
Ledger database is the primary database. Add/update programmes and update account balances in a single transaction. Currently implemented only for AWS QLDB

Operational Database is the secondary database. Eventually replicated to this from primary database via data stream. Implemented based on PostgresSQL

**Why Two Database Approach?**
1. Cost and Query capabilities - Ledger database (blockchain) read capabilities can be limited and costly. To support rich statistics and minimize the cost, data is replicated in to a cheap query database.
2. Disaster recovery
3. Scalability - Primary/secondary database architecture is scalable since additional secondary databases can be added as needed to handle more read operations.

**Why Ledger Database?**
1. Immutable and Transparent - Track and maintain a sequenced history of every carbon programme and credit change. 
2. Data Integrity (Cryptographic verification by third party).
3. Reconcile carbon credits and company account balance.

**Ledger Database Interface**

This enables the capability to add any blockchain or ledger database support to the carbon registry without functionality module changes. Currently implemented for PostgresSQL and AWS QLDB.

**PostgresSQL Ledger Implementation** storage all the carbon programme and credit events in a separate event database with the sequence number. Support all the ledger functionalities except immutability.  


Single database approach used for user and company management. 


### **Ledger Layout**
Carbon Registry contains 3 ledger tables.
1. Programme ledger - Contains all the programme and credit transactions.
2. Company Account Ledger (Credit) - Contains company accounts credit transactions.
3. Country Account Ledger (Credit) - Contains country credit transactions.

The below diagram demonstrates the the ledger behavior of programme create, authorise, issue and transfer processes. Blue color document icon denotes a single data block in a ledger.

![alt text](./documention/imgs/Ledger.svg)

### **Authentication**
- JWT Authentication - All endpoints based on role permissions.
- API Key Authentication - MRV System connectivity.

<a name="structure"></a>
## Project Structure

    .
    ├── .github                         # CI/CD [Github Actions files]
    ├── deployment                      # Declarative configuration files for initial resource creation and setup [AWS Cloudformation]
    ├── backend                         # System service implementation
        ├── services                    # Services implementation [NestJS application]
            ├── src
                ├── national-api        # National API [NestJS module]      
                ├── stats-api           # Statistics API [NestJS module]
                ├── ledger-replicator   # Blockchain Database data replicator [QLDB to Postgres]
                ├── shared              # Shared resources [NestJS module]     
            ├── serverless.yml          # Service deployment scripts [Serverless + AWS Lambda]
    ├── libs
        ├── carbon-credit-calculator    # Implementation for the Carbon credit calculation library [Node module + Typescript]
        ├── serial-number-gen           # Implementation for the carbon programme serial number calculation [Node module + Typescript]
    ├── web                             # System web frontend implementation [ReactJS]
    ├── .gitignore
    ├── docker-compose.yml              # Docker container definitions
    └── README.md

<a name="container"></a>
## Run Services As Containers
- Update [docker compose file](./docker-compose.yml) env variables as required.
    - Currently all the emails are disabled using wnv variable `IS_EMAIL_DISABLED`. When the emails are disabled email payload will be printed on the console. User account passwords needs to extract from this console log (Including root user account, search for a log line starting with ```Password (temporary)``` on national container [`docker logs -f undp-carbon-registry-national-1`]). 
    - Add/update following environment variables to enable email functionality.
        - IS_EMAIL_DISABLED=false
        - SOURCE_EMAIL (Sender email address)
        - SMTP_ENDPOINT
        - SMTP_USERNAME
        - SMTP_PASSWORD
    - Use `DB_PASSWORD` env variable to change PostgresSQL database password
    - Configure system root account email by updating environment variable `ROOT EMAIL`. If the email service is enabled, on the first docker start, this email address will receive a new email with the root user password.
- Run `docker-compose up -d`. This will build and start containers for following services,
    - PostgresDB container
    - National service
    - Analytics service
    - Replicator service
    - React web server with Nginx. 
- Web frontend on http://localhost:3030/
- API Endpoints,
  - http://localhost:3000/national#/
  - http://localhost:3100/stats#/ 

<a name="local"></a>
## Run Services Locally
- Setup postgreSQL locally and create a new database.
- Update following DB configurations in the .env.local file (If the file does not exist please create a new .env.local)
    - DB_HOST (Default localhost)
    - DB_PORT (Default 5432)
    - DB_USER (Default root)
    - DB_PASSWORD
    - DB_NAME (Default carbondbdev)
- Move to folder `cd backend/service`
- Run `yarn run sls:install `
- Initial user data setup `serverless invoke local --stage=local --function setup --data '{"rootEmail": "<Root user email>","systemCountryCode": "<System country Alpha 2 code>", "name": "<System country name>", "logoBase64": "<System country logo base64>"}'`
- Start all the services by executing `sls offline --stage=local`
- Now all the system services are up and running. Swagger documentation will be available on `http://localhost:3000/local/national`

<a name="cloud"></a>
## Deploy System on the AWS Cloud
- Execute to create all the required resources on the AWS.
    ```
    aws cloudformation deploy --template-file ./deployment/aws-formation.yml --stack-name carbon-registry-basic --parameter-overrides EnvironmentName=<stage> DBPassword=<password> --capabilities CAPABILITY_NAMED_IAM
    ```
- Setup following Github Secrets to enable CI/CD
    - AWS_ACCESS_KEY_ID
    - AWS_SECRET_ACCESS_KEY
- Run it manually to deploy all the lambda services immediately. It will create 2 lambda layers and following lambda functions,
    - national-api: Handle all carbon registry user and program creation. Trigger by external http request.
    - replicator: Replicate Ledger database entries in to Postgres database for analytics. Trigger by new record on the Kinesis stream.
    - setup: Function to add initial system user data.
- Create initial user data in the system by invoking setup lambda function by executing
    ```
    aws lambda invoke \
        --function-name carbon-registry-services-dev-setup --cli-binary-format raw-in-base64-out\
        --payload '{"rootEmail": "<Root user email>","systemCountryCode": "<System country Alpha 2 code>", "name": "<System country name>", "logoBase64": "<System country logo base64>"}' \
        response.json
    ```

    
### Carbon Credit Calculator
Carbon credit calculation implemented in a separate node module. [Please refer this](./libs/carbon-credit-calculator/README.md) for more information.


### Serial Number Generation
Serial Number generation implemented in a separate node module. [Please refer this](./libs/serial-number-gen/README.md) for more information.

<a name="user"></a>
## User Onboarding and Permissions Model

### User Roles
System pre-defined user roles are as follows,
- Root
- Company Level (National Government, Programme and Certification Company come under this level) 
    - Admin 
    - Manager 
    - View Only 

### User Onboarding Process
1. After the system setup, the system have a Root User for the setup email (one Root User for the system) 
2. Root User is responsible for creating the Government entity and the Admin of the Government 
3. The Government Admin is responsible for creating the other companies and Admins of each company. 
4. Admin of the company has the authority to add the remaining users (Admin, Managers, View Only Users) to the company. 
5. When a user is added to the system, a confirmation email should be sent to users including the login password. 


### User Management 

All the CRUD operations can be performed as per the following table,

| Company Role | New User Role | Authorized User Roles (Company) |
| --- | --- | --- |
| Government | Root | Cannot create new one other than the default system user and Can manage all the users in the system |
| Government | Admin<br>Manager<br>View Only | Root<br>Admin(Government) |
| All other Company Roles | Admin<br>Manager<br>View Only | Root<br>Admin(Government)<br>Admin(Company) |

- All users can edit own user account except Role and Email.
- Users are not allowed to delete the own account from the system.

<a name="frontend"></a>
### Web Frontend
Web frontend implemented using ReactJS framework. Please refer [getting started with react app](./web/README.md) for more information.

<a name="localization"></a>
### Localization
* Languages (Current): English
* Languages (In Progress): French. Spanish 
For updating translations or adding new ones, reference https://github.com/undp/carbon-registry/tree/main/web/public/Assets/i18n 

<a name="api"></a>
### Application Programming Interface (API)
For integration, reference RESTful Web API Documentation documentation via Swagger. To access
- National API: api.APP_URL/national
- Status API: api.APP_URL/stats

<a name="status"></a>
### Status Page
For transparent uptime monitoring go to status.APP_URL
Open source code available at https://github.com/undp/carbon-registry-status

<a name="support"></a>
### Governance and Support
![undp-logo-blue](https://user-images.githubusercontent.com/109564/160651473-6d8daf4d-77fa-41ff-855c-43a0512353b6.svg) With funding, coordination and support from [United Nations Development Programme](https://www.undp.org)

UNDP is responsible for managing the application. 

Availability problems, failures of platform components, capacity requirements, performances degradation, database indexing, backup and monitoring are all in the responsibility of UNDP.

UNDP is also responsible for performing the user support.

By performing such support UNDP may require assistance from [Xeptagon](https://www.xeptagon.com). 
