
# Carbon Registry
Carbon credit initiative for ExO and HQ/GEF from Vanuatu Carbon Registry.

## Standard
This codebase aims to fullfill the digital public goods standard:
https://digitalpublicgoods.net/standard/

## System Architecture
UNDP Carbon Registry based on AWS Serverless
![alt text](./documention/imgs/System%20Architecture.svg)

## Project Structure

    .
    ├── .github                         # Github Actions files
    ├── deployment                      # AWS cloudformation files for initial resource creation and setup
    ├── lambda                          # Server implementation - NestJS applications
        ├── layer                       # AWS lambda layer
            ├── serverless.yml          # AWS Lambda Layer deployment configuration
        ├── services                    # AWS lambda function deployments scripts and implementation (NestJS application)
            ├── src
                ├── national-api        # National API NestJS module       
                ├── operational-api     # Operation API NestJS module
                ├── certifier-api       # Certifier API NestJS module
                ├── ledger-replicator   # QLDB ledger data replicator
                ├── shared              # Shared resources
            ├── serverless.yml          # AWS Lambda function deployment scripts for services 
    ├── libs
        ├── carbon-credit-calculator    # Node module implementation for the Carbon credit calculation library
        ├── serial-number-gen           # Node module implementation for the carbon programme serial number calculation
    ├── web                             # System ReactJS web frontend implementation
    ├── .gitignore
    └── README.md

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
- Now all the system services are up and running. Swagger documentation will be available on `http://localhost:3000/local/api/national/docs#/`

## Deploy System on AWS
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
