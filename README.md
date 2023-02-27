## Index
* [About](#about)
* [Standards](#standards)
* [Architecture](#architecture)
* [Project Structure](#structure)
* [Run Services Locally](#local)
* [Run Services on Cloud](#cloud)
* [User Onboarding](#user)
* [Web Frontend](#frontend)
* [API](#api)
* [Status Page](#status)
* [Governance & Support](#support)

<a name="about"></a>
# Carbon Registry
The National Carbon Registry enables carbon credit trading in order to reduce greenhouse gas emissions.

As an online database, the National Carbon Registry uses standards national and international standards for quantifying and verifying greenhouse gas emissions reductions of programmes, tracking issued carbon credits and enabling credit transfers in an efficient and transparent manner. The Registry functions by receiving, processing, recording and storing data on mitigations projects, the issuance, holding, transfer, acquisition, cancellation, and retirement of emission reduction credits. This information is publicly accessible to increase public confidence in the emissions reduction agenda.

The National Carbon Registry enables carbon credit tracking transactions from mitigation activities, as the digital implementation of the Paris Agreement. Any country can customize and deploy a local version of the registry then connect it to other national & international registries, MRV systems, and more. 

The system has 3 key features:
* **Analytics Dashboard:** Enabling governments, companies, and certification bodies to operate transparently and function on an immutable blockchain.
* **Carbon Credit Calculator:** Standardized system According to the UNFCCC - CDM (Clean Development Mechanism) methodologies, across defined sectors. 
* **Serial Number Generator:** Standardizing the technical format to allow for easy cross-border collaboration between carbon trading systems.

<a name="standards"></a>
## Standards
This codebase aims to fullfill the digital public goods standard:
https://digitalpublicgoods.net/standard/
It is built according to the Principles for Digital Development:
https://digitalprinciples.org/ 

<a name="architecture"></a>
## System Architecture
UNDP Carbon Registry based on Serverless Architecture. It can be ported and hosted on any Function As A Service (FaaS) stack.
![alt text](./documention/imgs/System%20Architecture.svg)

Carbon Registry backend system has a service oriented architecture (SOA) and contains 4 main services.

<a name="services"></a>
### **Services**
#### *National Service*

Authenticate, Validate and Accept user (Government, Programme Developer/Certifier) API request related to following functionalities,
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
Serve all the system analytics. Generate all the statistic using the operational database. 
Horizontally scalable. 

#### *Replicator Service*
Replicating ledger database new items to a operational database asynchronously. During the replication process it is injecting additional query information to the data. 
In the current setup using AWS QLDB for the ledger database. When it creates or updates data, add the change to a AWS Kinesis Data Stream. Replicator service is consuming the stream.

#### *Operational Service*
Service that use to do system operations,
1. Database migrations.
2. User data creation and update.
3. Resource creation.

Can trigger internally. Cannot invoke by external sources. 

### **Database Architecture**
primary/secondary database architecture using for carbon programme and account balances. 
Ledger database - Primary database. Add/update programmes and update account balances in single transaction. Currently implemented only for AWS QLDB

Operational Database - Secondary database. Eventually add data for query purposes though replicator and data stream. Implemented based on PostgresSQL

**Why Two Database Approach?**
1. Cost and Query capabilities - Ledger database (blockchain) read capabilities can be limited and costly. To support rich statistics, replicated data in to a cheap query database.
2. Disaster recovery
3. Scalability - Primary/secondary database architecture is scalable since additional secondary databases can be added as needed to handle more read operations.

**Why Ledger Database?**
1. Immutable and Transparent - Track and maintain a sequenced history of every carbon programme and credit change. 
2. Data Integrity (Cryptographic verification by third party).
3. Reconcile carbon credit and company account balance.

**Ledger Database Interface**

This enables the capability to add any blockchain or ledger database support to the carbon registry without application changes. Currently for the production system interface implemented for AWS QLDB. For testing purposes interface implemented for PostgresSQL as well.



Single database approach use for user and company management. 


### **Ledger Layout**
Carbon Registry contains 3 ledger tables.
1. Programme ledger - Contains all the programme and credit transactions.
2. Company Account Ledger (Credit) - Contains company accounts credit transactions.
3. Country Account Ledger (Credit) - Contains country credit transactions.

Below diagram demonstrate the the ledger behavior on programme create, authorise, issue and transfer processes. Blue color document denotes a single data block in a ledger.

![alt text](./documention/imgs/Ledger.png)

### **Authentication**
- JWT Authentication - All endpoints based on role permissions.
- API Key Authentication - MRV System connectivity.

<a name="structure"></a>
## Project Structure

    .
    ├── .github                         # CI/CD [Github Actions files]
    ├── deployment                      # Declarative configuration files for initial resource creation and setup [AWS Cloudformation]
    ├── lambda                          # System service implementation [NestJS applications, Serverless + AWS Lambda]
        ├── layer                       # Service dependency layer [AWS Lambda Layers]
            ├── serverless.yml          # Service dependency layer deployment scripts [ Serverless + AWS Lambda Layer]
        ├── services                    # Services implementation [AWS lambda - NestJS application]
            ├── src
                ├── national-api        # National API [NestJS module]      
                ├── stats-api           # Statistic API [NestJS module]
                ├── ledger-replicator   # Blockchain Database data replicator [QLDB to Postgres]
                ├── shared              # Shared resources [NestJS module]     
            ├── serverless.yml          # Service deployment scripts [Serverless + AWS Lambda]
    ├── libs
        ├── carbon-credit-calculator    # Implementation for the Carbon credit calculation library [Node module + Typescript]
        ├── serial-number-gen           # Implementation for the carbon programme serial number calculation [Node module + Typescript]
    ├── web                             # System web frontend implementation [ReactJS]
    ├── .gitignore
    └── README.md

<a name="local"></a>
## Run Services Locally
- Setup postgreSQL locally and create a new database.
- Update following DB configurations in the .env.local file (If file does not exist please create a new .env.local)
    - DB_HOST (Default localhost)
    - DB_PORT (Default 5432)
    - DB_USER (Default root)
    - DB_PASSWORD
    - DB_NAME (Default carbondbdev)
- Move to folder `cd lambda/service`
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
System pre-defined user roles as follows,
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

All the CRUD operations can perform as per the following table,

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
