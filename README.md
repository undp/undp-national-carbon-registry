![GitHub last commit](https://img.shields.io/github/last-commit/undp/carbon-registry)
![Uptime](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/undp/carbon-registry-status/master/api/carbon-registry/uptime.json)
![GitHub Workflow Status (with branch)](https://img.shields.io/github/actions/workflow/status/undp/carbon-registry/server-deployments.yml?branch=main&label=server%20build)
 ![GitHub Workflow Status (with branch)](https://img.shields.io/github/actions/workflow/status/undp/carbon-registry/frontend-deployment-prod.yml?branch=main&label=frontend%20build)
[![](https://img.shields.io/badge/chat-SparkBlue-blue)](https://www.sparkblue.org/group/keeping-track-digital-public-goods-paris-agreement)
[![](https://img.shields.io/badge/Digital%20Public%20Good-Certified-blueviolet)](https://app.digitalpublicgoods.net/a/10403)

<a name="about"></a>

# National Carbon Credit Registry
The National Carbon Registry enables carbon credit trading in order to reduce greenhouse gas emissions.

As an online database, the National Carbon Registry uses national and international standards for quantifying and verifying greenhouse gas emissions reductions by projects, tracking issued carbon credits and enabling credit transfers in an efficient and transparent manner. The Registry functions by receiving, processing, recording and storing data on mitigations projects, the issuance, holding, transfer, acquisition, cancellation, and retirement of emission reduction credits. This information is publicly accessible to increase public confidence in the emissions reduction agenda.

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

Authenticate, Validate and Accept user (Government, Project Developer/Certifier) API requests related to the following functionalities,
- User and company CRUD operations.
- User authentication.
- Project life cycle management. 
- Credit life cycle management.

Service is horizontally scalable and state maintained in the following locations,
- File storage.
- Operational Database.
- Ledger Database.

Uses the Carbon Credit Calculator and Serial Number Generator node modules to estimate the project carbon credit amount and issue a serial number.
Uses Ledger interface to persist project and credit life cycles.

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
Primary/secondary database architecture used to store carbon project and account balances. 
Ledger database is the primary database. Add/update projects and update account balances in a single transaction. Currently implemented only for AWS QLDB

Operational Database is the secondary database. Eventually replicated to this from primary database via data stream. Implemented based on PostgresSQL

**Why Two Database Approach?**
1. Cost and Query capabilities - Ledger database (blockchain) read capabilities can be limited and costly. To support rich statistics and minimize the cost, data is replicated in to a cheap query database.
2. Disaster recovery
3. Scalability - Primary/secondary database architecture is scalable since additional secondary databases can be added as needed to handle more read operations.

**Why Ledger Database?**
1. Immutable and Transparent - Track and maintain a sequenced history of every carbon project and credit change. 
2. Data Integrity (Cryptographic verification by third party).
3. Reconcile carbon credits and company account balance.

**Ledger Database Interface**

This enables the capability to add any blockchain or ledger database support to the carbon registry without functionality module changes. Currently implemented for PostgresSQL and AWS QLDB.

**PostgresSQL Ledger Implementation** storage all the carbon project and credit events in a separate event database with the sequence number. Support all the ledger functionalities except immutability.  


Single database approach used for user and company management. 


### **Ledger Layout**
Carbon Registry contains 3 ledger tables.
1. Project ledger - Contains all the project and credit transactions.
2. Company Account Ledger (Credit) - Contains company accounts credit transactions.
3. Country Account Ledger (Credit) - Contains country credit transactions.

The below diagram demonstrates the the ledger behavior of project create, authorise, issue and transfer processes. Blue color document icon denotes a single data block in a ledger.

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
        ├── serial-number-gen           # Implementation for the carbon project serial number calculation [Node module + Typescript]
    ├── web                             # System web frontend implementation [ReactJS]
    ├── .gitignore
    ├── docker-compose.yml              # Docker container definitions
    └── README.md

<a name="container"></a>
## Run Services As Containers
- Update [docker compose file](./docker-compose.yml) env variables as required.
    - Currently all the emails are disabled using env variable `IS_EMAIL_DISABLED`. When the emails are disabled email payload will be printed on the console. User account passwords needs to extract from this console log. Including root user account, search for a log line starting with ```Password (temporary)``` on national container (`docker logs -f undp-carbon-registry-national-1`). 
    - Add / update following environment variables to enable email functionality.
        - `IS_EMAIL_DISABLED`=false
        - `SOURCE_EMAIL` (Sender email address)
        - `SMTP_ENDPOINT`
        - `SMTP_USERNAME`
        - `SMTP_PASSWORD`
    - Use `DB_PASSWORD` env variable to change PostgresSQL database password
    - Configure system root account email by updating environment variable `ROOT EMAIL`. If the email service is enabled, on the first docker start, this email address will receive a new email with the root user password.
    - By default frontend does not show map images on dashboard and project view. To enable them please update `REACT_APP_MAP_TYPE` env variable to `Mapbox` and add new env variable `REACT_APP_MAPBOXGL_ACCESS_TOKEN` with [MapBox public access token](https://docs.mapbox.com/help/tutorials/get-started-tokens-api/) in web container. 
- Add user data
  - Update [organisations.csv](./organisations.csv) file to add organisations.
  - Update [users.csv](./users.csv) file to add users.
  - When updating files keep the header and replace existing dummy data with your data.
  - These users and companys add to the system each docker restart.
- Run `docker-compose up -d --build`. This will build and start containers for following services,
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

<a name="external"></a>
## External Connectivity

### ITMO Platform
1. Carbon Registry make a daily to the retrieve ITMO platform projects.
2. Projects create in the Carbon Registry when projects are authorized in the ITMO Platform 
3. The Carbon Registry update when the projects are Issued with credits in the ITMO Platform 

#### <b>Lifecycle</b>
![alt text](./documention/imgs/ITMOxCARBON_LifeCycle.svg)

#### <b>Project Creation and Authorisation</b>
- Authorisation of projects in the ITMO Platform identified by the event name: "ITMO-Design Document (DD) & Validation Report / Upload on National Public Registry". 
- If the Company Tax Id doesn’t exist in the Carbon Registry, that company created in the Carbon Registry.
- When creating the project: 
    - The project created with the state “Pending”  
    - The credit estimate set to 100 by default
    - The company percentage set to 100% 
    - The serial number for the project generated the same as any other project in the Carbon Registry. 
- Projects retrieved from the ITMO Platform and created in the Carbon Registry can Authorised/Rejected by a Government user the same as any other project in the Carbon Registry
- When a project is authorised, the authorised credits will be the default credit estimate mentioned above. The project can be issued with credits by a Government user the same as any other project in the Carbon Registry. 

#### <b>Credit Issuance</b>
- Credits can be issued for projects retrieved from the ITMO Platform and created in the Carbon Registry in two ways; 
    - By a Government user the same as any other project. 
    - Credit issuance in the ITMO Platform which should be reflected in the Carbon Registry. 
- In the case of 2 above, 
    - Credit issuance identified by the event name: "Upload Final Monitoring Report" in the ITMO Platform. 


#### <b>Field Mapping</b>

<b>Company</b>
| **Name in the Carbon Registry**   | **Mandatory in the Carbon Registry**   | **Name in the ITMO Platform**   |
| --- | --- | --- |
| Tax ID (_taxId_)  | Yes  | company  |
| Name (_name_)  | Yes  | company  |
| Email (_email_)  | Yes  | Set default : nce.digital+[_organisation_]@undp.org  |
| Phone Number (_phoneNo_)  | Yes  | Set default : 00  |
| Website  |   |   |
| Address  |   | Set default : Country if the Registry  |
| Logo  |   |   |
| Country (_country_)  |   | Set default : Country of the Registry  |
| Role (_companyRole_)  | Yes  | Set default : ProgrammeDeveloper  |

<br><b>User</b>
| Name in the Carbon Registry | Mandatory in the Carbon Registry | Name in the ITMO Platform |
| --- | --- | --- |
| Email (_email_)  | Yes  | Set default : nce.digital+[_organisation_]@undp.org  |
| Role (_role_)  | Yes  | Set default : Admin  |
| Phone Number (_phoneNo_)  |   | Set default : 00  |

<br><b>Project</b>
| **Name in the Carbon Registry**   | **Mandatory in the Carbon Registry**   | **Name in the ITMO Platform**   |
| --- | --- | --- |
| Project Name (title)  | Yes  | Name  |
| External ID (externalId)  | Yes  | id  |
| Credit Issuance Serial Number   |   |   |
| Current Status   |   | Set default : Pending  |
| Applicant Type   |   | Set default : Project Developer  |
| Sector (_sector_)  | Yes  | [Sector](#itmo-sector-mapping)  |
| Sectoral Scope (_sectoralScope_)  | Yes  | [Sector](#itmo-sector-mapping)|
| Project Start Date (_startTime_)  | Yes  | createdAt  |
| Project End Date  (_endTime_)  | Yes  | createdAt + 10 years  |
| Geographical Location (Regional) (_geographicalLocation_)  | Yes  | country _(Name not mentioned as ISO3 or actual name)_  |
| Buyer Country Eligibility   |   |   |
| Project Cost (USD) (_programmeCostUSD_)  | Yes  | Set default : Null  |
| Financing Type   |   |   |
| Grant Equivalent Amount   |   |   |
| Carbon Price (Dollars per ton)   |   |   |
| Company   |   | company  |
| Company Tax ID (_proponentTaxVatId_)  | Yes  | company  |
| Company Percentage (_proponentPercentage_)  | Yes  | Set default : 100%  |
| Type of Mitigation Action/Activity (_typeOfMitigation_)  | Yes  | [Sector](#itmo-sector-mapping) |
| GHGs Covered (_greenHouseGasses_)  | Yes  | Set default :  CO2  |
| Credits Authorised  |   | Set default : 100  |
| Credits Issued   |   | Set default : 10   |
| Credits Transferred   |   |   |
| Credits Frozen   |   |   |
| Credits Retired   |   |   |
| Credits authorised for international transfer and use (Total cumulative maximum amount of Mitigation Outcomes for which international transfer and use is authorized)   |   |   |
| Crediting Period (years)   |   |   |
| Project Materials   |   | Files \*   |
| Project Materials  |   | Files \*  |
| **Credit Calculation Fields / Mitigation Type Calculation**    |   |   |
| **Agriculture**   |   |   |
| Land Area  |   |   |
| Land Area Unit  |   |   |
| **Solar**   |   |   |
| energy generation  |   |   |
| energy generation unit  |   |   |
| consumer group  |   |   |

#### <b>ITMO Sector Mapping</b>
|ITMO Sector Field Value|Sector|Sectoral Scope|Type Of Mitigation|
| -- | -- | -- | -- |
|energy-distribution|Energy|Energy Distribution|Energy Distribution
|agriculture|Agriculture|Agriculture|Agriculture|
|energy-industries|Energy|Energy Industry|EE Industry
|Default|Other|Energy Industry|EE Industry


#### <b>Assumptions</b>
- Project estimated credit amount is 100.
- Project issued credit amount is always 10.

#### <b>Docker Integration Setup</b>
1. Append `data-importer` to `docker-compose` file `replicator` service `RUN_MODULE` env variable with comma separated. 
2. Update following env variables in the `docker-compose` file `replicator` service.
    - ITMO_API_KEY
    - ITMO_EMAIL
    - ITMO_PASSWORD
    - ITMO_ENDPOINT
3. Projects will import on each docker restart. 

<a name="user"></a>
## User Onboarding and Permissions Model

### User Roles
System pre-defined user roles are as follows,
- Root
- Company Level (National Government, Project and Certification Company come under this level) 
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
Please refer [here](./web/public/locales/i18n/README.md) for adding a new language translation file.

<a name="api"></a>
### Application Programming Interface (API)
For integration, reference RESTful Web API Documentation documentation via Swagger. To access
- National API: api.APP_URL/national
- Status API: api.APP_URL/stats

<a name="resource"></a>
### Resource Requirements

| Resource | Minimum | Recommended |
| :---         |           ---: |          ---: |
| Memory   | 4 GB    | 8 GB    |
| CPU     | 4 Cores       |   4 Cores   |
| Storage     |  20 GB       |   50 GB   |
| OS     | Linux <br> Windows Server 2016 and later versions.      |      |

Note: Above resource requirement mentioned for a single instance from each microservice.

<a name="status"></a>
### Status Page
For transparent uptime monitoring go to status.APP_URL
Open source code available at https://github.com/undp/carbon-registry-status

<a name="support"></a>
### Governance and Support
[Digital For Climate (D4C)](https://www.theclimatewarehouse.org/work/digital-4-climate) is responsible for managing the application. D4C is a collaboration between the [European Bank for Reconstruction and Development (EBRD)](https://www.ebrd.com), [United Nations Development Program (UNDP)](https://www.undp.org), [United Nations Framework Convention on Climate Change (UNFCCC)](https://www.unfccc.int), [International Emissions Trading Association (IETA)](https://www.ieta.org), [European Space Agency (ESA)](https://www.esa.int), and [World Bank Group](https://www.worldbank.org) that aims to coordinate respective workflows and create a modular and interoperable end-to-end digital ecosystem for the carbon market. The overarching goal is to support a transparent, high integrity global carbon market that can channel capital for impactful climate action and low-carbon development. 

This code is managed by [United Nations Development Programme](https://www.undp.org) as custodian. For any questions, contact us at digital@undp.org .
