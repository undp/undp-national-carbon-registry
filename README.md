## 📄 Description – Côte d'Ivoire National Carbon Credit Registry Côte d'Ivoire Template of National Carbon Credit Registry

This repository contains the **template source code** for the **National Carbon Credit Registry** developed for the Republic of Côte d’Ivoire. It is based on the **🧩 open-source reference implementation by UNDP**, recognized as a **Digital Public Good (DPG)**.

This template is designed to help countries build their own carbon credit registries aligned with **Article 6 of the Paris Agreement**. It provides a modular, scalable, and interoperable digital foundation for managing carbon credit projects, tracking emissions reductions, and facilitating national and international carbon transactions.

> 🔁 The Côte d'Ivoire template includes adaptations for local regulatory and institutional frameworks, along with enhanced modules such as **blockchain traceability**, **generative AI**, **geolocation**, and **electronic signature management**.

------

### 🌟 Key Benefits

- 🧩 **Interoperable Design**: Built on international climate governance standards and compatible with global reporting systems.
- 💡 **Flexible Architecture**: Can be customized to meet specific national contexts and legal structures.
- 🔍 **Enhanced Traceability**: Integrated blockchain ensures verifiable and immutable records of all registry actions.
- 🇨🇮 **Local Workflow Support**: Includes support for roles like Project Developer, Certifier, and National Carbon Market Bureau.

------

### ✨ Key Features

| 🌐 **Category**            | 🔧 **Feature**                            | 📝 **Description**                                            |
| ------------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| 📊 **Visualization**       | **Interactive dashboard**                | Dynamic display of project data, credits, transfers, and status indicators. |
| 🧾 **Projects**            | **Idea Note Management (NIP)**           | Submission, validation, and tracking of Project Idea Notes according to national criteria. |
| 🌱 **Project Lifecycle**   | **Comprehensive project tracking**       | End-to-end monitoring from project registration to certification, including progress reports. |
| 🏦 **Financing**           | **Activity and funding tracking**        | Management of financial flows and project activities.        |
| 🗺️ **Geolocation**         | **GIS – Project overlap detection**      | Identification of spatial conflicts using Geographic Information System (GIS). |
| 🔐 **Security**            | **Authentication and signatures**        | Electronic and manual signature of official documents (Approval letters, Eligibility letters, etc.). |
| 🔄 **Transfers**           | **Carbon credit transfers**              | Monitoring of both national and international carbon credit transfers. |
| 🧠 **Generative AI**       | **TED (AI assistant)**                   | AI-assisted writing, document generation, and smart support for decision-making. |
| 📁 **Document Management** | **Electronic Document Management (EDM)** | Archiving, sorting, and metadata-based retrieval enhanced by AI. |
| 🧬 **Traceability**        | **Blockchain integration**               | Immutable recording of every action taken within the registry. |
| 👥 **User Management**     | **Profiles and roles**                   | Registration, access control, and supervision of actors (Developer, Certifier, Carbon Market Bureau). |

------

## 📦 Installation

### 🏗️ Architecture Overview

This template is built upon the official open-source architecture of the **UNDP National Carbon Credit Registry**.

It follows a modular and scalable design based on three core components:

1. **Frontend** (React + Vite): User interface for all registry actors (Developers, Certifiers, National Authority).
2. **Backend** (Node.js + Express): Business logic, API services, authentication, and validation.
3. **Database** (PostgreSQL,mongo DB): Stores all registry-related data (projects, credits, transactions, users).

Optional components include:

- **Blockchain Layer** (e.g., Hyperledger or Ethereum) for traceability
- **Document Authentication & e-Signature**
- **AI Assistant** for generative document support
- **Geospatial System (GIS)** for project overlap detection

> This architecture allows countries to deploy a full-featured, Paris Agreement–compliant national registry with full control over data sovereignty and transparency.

**📐 Architecture diagram:**

> ![](D:\COTE IVOIRE CARBONE REGISTRY\ReadMe\Carbon Registry Architecture-System Architecture.drawio.png)

------

### ✅ Prerequisites

- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **Docker & Docker Compose** *(optional but recommended for development/testing)*
- **Git** (for cloning the repository)

------

## 📦 Installation

### 🏗️ Architecture Overview

This project is based on the **official open-source template of the UNDP National Carbon Credit Registry**, adapted for the **Côte d’Ivoire implementation**.

It follows a **modular architecture** with clearly separated components:

- A **central backend** managing credits, projects, and validation workflows
- A **web frontend interface** for all stakeholders (Developers, Certifiers, Carbon Market Bureau)
- Additional services such as **electronic signature**, **geospatial overlap detection**, and **shared logic libraries**

------

### 🧾 Step 1: Clone the Repository

```bash
git clone https://github.com/undp/undp-carbon-registry.git
cd undp-carbon-registry
git checkout "Côte-d-Ivoire"
```

------

### 🗂️ Step 2: Explore the Project Structure

After cloning, the project contains several modules:

```
undp-carbon-registry/
├── api_idea_note_manage_and_project_maps_intersection/  # GIS + Idea Note API
├── carbon_service_lib/                                  # Shared logic and utilities components UNDP REGISTRY CUSTOM
├── carbon-library-main/                                 #backend components UNDP REGISTRY CUSTOM
├── carbon-registry-main/                                # UNDP DPG REGISTRY CUSTOM
├── registry_website/                                    # Frontend web interface
├── sign_plateform/                                      # Electronic signature service
└── README.md
```

> Each directory is a standalone component. It must be set up individually with dependencies and environment configuration.

------

### ⚙️ Step 3: Start "carbon-registry-main"

Navigate into each module and run the installation:

> **"To begin, start with the `carbon-registry-main` module, following the step-by-step installation process from the UNDP’s Digital Public Good (DPG) Carbon Registry template."**

[undp/undp-carbon-registry: CURRENTLY UNDER CONSTRUCTION. NEW RELEASE END OF APRIL. National Carbon Credit Registry Digital Public Good (DPG) by Digital For Climate (D4C) collaboration. Code coordinated by ExO/CDO & BPPS/Climate.](https://github.com/undp/undp-carbon-registry/tree/main)

------

> ⚠️ **Important Step – Start Here First** ⚠️
>
> ✅ **Step-by-step:** Follow the instructions provided in the `README.md` of the `carbon-registry-main` module. This is the **foundational service** and must be set up **before any other component**.
>
> 🔐 **Once installed**, make sure to **note down the authentication credentials** and **API connection details** required for communication with the **National API Service**.
>
> 📣 This configuration is **critical** for ensuring that all other modules (e.g., frontend, signature service, idea note API) can connect properly to the registry backend.

### ⚙️ Step 4: Start    "api_idea_note_manage_and_project_maps_intersection" 

------

## 📁 Project Structure: `api_idea_note_manage_and_project_maps_intersection/`

This module handles both **Project Idea Note Management** and **Geospatial Map Intersections** (for overlap detection between carbon projects). Below is the structure of its backend codebase:

```
api_idea_note_manage_and_project_maps_intersection/
├── controllers/       # Handles request logic for API endpoints
├── models/            # Data models ( MongoDB)
├── node_modules/      # Installed dependencies (auto-generated)
├── public/            # Static files (images, frontend assets)
├── routes/            # Route definitions mapped to controllers
├── setting/           # Configuration files and constants
├── views/             # Template files 
├── .env               # Environment variable definitions
├── app.js             # Main application entry point
├── package.json       # Project metadata and dependencies
└── package-lock.json  # Auto-generated lock file for NPM dependencies
```

### 🔍 Key Highlights

| Folder/File    | Description                                                  |
| -------------- | ------------------------------------------------------------ |
| `controllers/` | Contains all business logic for REST API endpoints           |
| `models/`      | Defines the structure of data and database interactions      |
| `routes/`      | Maps API paths to corresponding controller methods           |
| `setting/`     | Stores configuration constants, like service URLs or app-level settings |
| `views/`       | (Optional) HTML or template rendering engine (e.g., EJS,)    |
| `.env`         | Secure environment variables for DB, ports, tokens, etc.     |
| `app.js`       | Entry point for starting the Node.js server and mounting routes/middleware |
| `package.json` | Lists required packages and scripts for development and production |

------

### ⚙️ Step-by-Step Configuration Guide

📁 **Module**: `api_idea_note_manage_and_project_maps_intersection`
 📄 **File**: `setting/default/default.js`

------

#### 🔹 Step 1: Open the configuration file

Navigate to the configuration directory and open the file:

```bash
cd api_idea_note_manage_and_project_maps_intersection/setting/default/
```

Then open the file `default.js` in your editor:

```bash
code default.js
```

*or*

```bash
nano default.js
```

------

#### 🔹 Step 2: Update the following `const` variables

Make sure to update **only these variables** with values appropriate to your environment:

| 🧩 **Variable**               | 📝 **Purpose**                                               | 🛠️ **Example**                                            |
| ---------------------------- | ----------------------------------------------------------- | -------------------------------------------------------- |
| `port`                       | Port where this service will run                            | `3002`                                                   |
| `Analytics_stat_api_service` | URL of the analytics/statistics service                     | `"http://localhost:3000"`                                |
| `National_api_service`       | URL of the national registry backend (carbon-registry-main) | `"http://localhost:3100"`                                |
| `conf_bdd.uri`               | MongoDB database URI                                        | `"mongodb://127.0.0.1:27017/carbon_register_ci_landing"` |
| `user_auth.user`             | Username for inter-service authentication                   | `"your-service-user"`                                    |
| `user_auth.password`         | Password for authentication                                 | `"your-secure-password"`                                 |
| `data_mailer.host`           | SMTP server for notifications                               | `"smtp.example.com"`                                     |
| `data_mailer.auth.user`      | Sender email address                                        | `"noreply@registry.ci"`                                  |
| `data_mailer.auth.pass`      | Email password or token                                     | `"your-email-password"`                                  |

------

#### ✅ Minimal example block

```js
const port = 3002;
const Analytics_stat_api_service = "http://localhost:3000";
const National_api_service = "http://localhost:3100";
const Api_idea_note_manage_and_project_maps_intersection_service = "http://localhost:3005";

const conf_bdd = {
  uri: "mongodb://127.0.0.1:27017/carbon_register_ci_landing",
  auth: false,
  user: "",
  pass: "",
  authsource: "admin",
};

const user_auth = {
  user: "your-service-user",
  password: "your-secure-password",
};

const data_mailer = {
  host: "smtp.example.com",
  port: 465,
  secure: true,
  name: "Carbon Registry Mailer",

  auth: {
    user: "noreply@registry.ci",
    pass: "your-email-password",
  },
};
```

------

> 🛑 **Important:** These variables are required for API interoperability, database connection, and automated email communication. Make sure they are set **before running the service**.

------

### 🔄 Step 3: Install Project Dependencies

After completing the configuration, return to the root directory of the module:

```bash
cd ../
```

Then install all required Node.js dependencies:

```bash
npm install
```

------

### 🚀 Step 4: Start the Service

Depending on your environment, choose one of the following methods to start the service:

#### 🧪 For Development Environment

Start the server directly using Node.js:

```bash
node app.js
```

> This will launch the API on the port specified in `default.js` (e.g., `http://localhost:3002`).

------

#### 🏭 For Production Environment

1. Install **PM2**, a process manager for Node.js:

```bash
npm install -g pm2
```

1. Start the service using PM2:

```bash
pm2 start app.js --name api-note-maps
```

> 🔁 PM2 will keep the process alive in the background and restart it automatically on crash or reboot.

------

### ✅ You're all set!

Your **Project Idea Note & Map Intersection API** is now running and ready to communicate with the national registry.

### ⚙️ Step 5: Start   "registry_website"

Perfect — thanks for the clarification!

Here’s a revised and accurate version of the **`registry_website/` project structure description**, reflecting its actual role as a **landing page** and **Project Idea Note submission platform**:

------

##### 📁 Project Structure: `registry_website/`

This module serves as the **public landing page** and **interface for submitting Project Idea Notes** within the Côte d’Ivoire National Carbon Registry. It provides external users (project developers, visitors) with access to registry information and allows them to initiate carbon project submissions.

```
registry_website/
├── bdd/             # Database connection and persistence logic
├── controllers/     # Handles submission logic and web request processing
├── models/          # Data validation and form schemas (e.g., idea notes)
├── node_modules/    # Installed dependencies (via npm)
├── programmation/   # Business logic (e.g., idea eligibility, verification helpers)
├── publics/         # Static assets (CSS, JS, images)
├── routes/          # Route definitions for landing page and forms
├── setting/         # Configuration files (e.g., default.js with API URLs, tokens)
├── tempfiles/       # Temporary file storage (e.g., draft uploads)
├── uploads/         # Uploaded documents for idea note submissions
├── views/           # HTML or templating files rendered to users
├── app.js           # Main server entry point (launches the Node.js app)
├── package.json     # Dependencies and metadata
├── package-lock.json# Dependency lock file
└── readme.md        # Local module documentation
```

------

### 🔍 Key Highlights

| Folder/File          | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| `controllers/`       | Processes incoming form submissions and page rendering       |
| `routes/`            | Express routes for landing page and idea note form           |
| `models/`            | Validation schemas for user input and submitted data         |
| `views/`             | User-facing HTML templates for the website and form          |
| `setting/default.js` | Critical config file: API endpoints, tokens, SMTP, MongoDB URI |
| `uploads/`           | Stores uploaded project documents from external users        |
| `programmation/`     | Contains helper functions like eligibility calculation logic |
| `tempfiles/`         | Temporary working files during document processing           |
| `publics/`           | Static resources served directly by the server (CSS, logos, JS) |

------

##### 🧭 Configuration & Installation Guide

📁 **Module**: `registry_website`
 📄 **Configuration file**: `setting/default/default.js`

------

### 🔹 Step 1: Open the Configuration File

Navigate to the configuration directory:

```bash
cd registry_website/setting/default/
```

Then open the file:

```bash
code default.js
```

*or*

```bash
nano default.js
```

------

### 🔹 Step 2: Update the Required Variables

Inside `default.js`, **only update the following constants** with values specific to your environment:

| 🧩 **Variable**                   | 💬 **Purpose**                           | 🛠️ **Example**                           |
| -------------------------------- | --------------------------------------- | --------------------------------------- |
| `port`                           | Port on which the service will run      | `3002`                                  |
| `api_url_1`                      | URL of the main backend service         | `http://localhost:3000`                 |
| `api_url_2`                      | URL of the national registry service    | `http://localhost:3100`                 |
| `api_url_3`                      | URL of the maps/idea-note API service   | `http://localhost:3005`                 |
| `app_token`, `eligi_token`       | Bearer tokens for secured communication | `"Bearer YOUR_TOKEN"`                   |
| `eligi_type_pay`                 | Payment type ID token                   | `"TYPE_PAIEMENT_...UUID"`               |
| `user_example`                   | Example of a bearer token               | `"Bearer ..." `                         |
| `admin[]`                        | Default admin accounts                  | e.g., `user: "Admin", pass: "@bonjour"` |
| `conf_bdd.uri`                   | MongoDB URI                             | `"mongodb://127.0.0.1:27017/..."`       |
| `user_auth.user` & `password`    | For inter-service authentication        | `"your-user"` / `"your-pass"`           |
| `JWT_SECRET`, `JWT_SECRET_ELIGI` | Secret keys for JWT generation          | `"your-secret"`                         |
| `JWT_Token_duration`             | Duration (in seconds or string format)  | `"3600"` or `"1h"`                      |
| `Doc_server`, `intern_server`    | Internal and document server URLs       | `http://localhost:3000`                 |
| `Doc_Token`                      | Token for document access               | `"YOUR_DOCUMENT_TOKEN"`                 |
| `contact_sender.title/sender`    | Email notification config               | `"Carbon Registry", "noreply@ci.ci"`    |
| `localisation_bmc`               | BMC contact & location metadata         | see default JSON                        |
| `logo_link`                      | URL to display a logo on the frontend   | `"https://..."`                         |
| `data_mailer.*`                  | Email SMTP configuration                | `"smtp.example.com"`, user/pass         |
| `ia.api_key`, `ia.source`        | AI bot integration tokens               | `"AI_KEY"`, `"AI_SOURCE"`               |

### 🔄 Step 3: Install Dependencies

Return to the root of the project and install:

```bash
cd ../
npm install
```

------

### 🚀 Step 4: Start the Service

#### 🔸 For Development

```bash
node app.js
```

#### 🔸 For Production (with PM2)

```bash
npm install -g pm2
pm2 start app.js --name registry-website
```

------

### 🎉 The frontend service is now running!

Check your browser at:
 🔗 `http://localhost:<your-port>` (e.g., `http://localhost:3002`)

------

### ⚙️ Step 5: Start   "sign_plateform"

##### 📁 Project Structure: `sign_plateform/`

The `sign_plateform` module is responsible for **document signature workflows** (electronic and manual), **inter-service verification**, and **token-based validation processes**. It integrates with the main registry backend, the idea note API, and analytics/statistics services.

```
sign_plateform/
├── bdd/             # Database connection logic (e.g., MongoDB setup)
├── controllers/     # Request handling logic (API endpoints, signature logic)
├── models/          # Data schemas and validation for documents and signatures
├── program/         # Custom workflows for signature orchestration
├── publics/         # Static assets (images, JS, CSS files)
├── routes/          # Route definitions mapped to controllers
├── settings/        # Configuration files (default.js holds env variables & tokens)
├── upload/          # Folder for temporary file uploads awaiting signature
├── app.js           # Main entry point for launching the Node.js server
├── package.json     # Dependency and script definitions
├── package-lock.json# Auto-generated NPM lock file
└── readme.md        # Local documentation file for the module
```

------

### 🔍 Key Highlights

| Folder/File           | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| `controllers/`        | Handles requests related to signing, verifying, and token handling |
| `models/`             | Defines data structures for documents, users, and signature metadata |
| `program/`            | Custom logic modules for signature workflows, validation rules, etc. |
| `settings/default.js` | Central configuration file for all API URLs, tokens, database, and mail settings |
| `upload/`             | Stores uploaded documents before and after signing           |
| `routes/`             | Defines the HTTP API structure exposed by this service       |
| `app.js`              | Launches the Node.js application                             |
| `bdd/`                | Handles database initialization and interaction logic        |
| `readme.md`           | Contains usage instructions for this specific module         |

------

> 💡 This module acts as the **signature engine** for the national registry system, ensuring traceability, secure authentication, and proper routing of project-related documents.

------

## 🧭 Configuration & Installation Guide

📁 **Module**: `sign_plateform/`
 📄 **Config file**: `settings/default/default.js`

------

### 🔹 Step 1: Navigate to the Configuration File

```bash
cd sign_plateform/settings/default/
```

Then open the file:

```bash
code default.js
```

*or*

```bash
nano default.js
```

------

### 🔹 Step 2: Update the Required Variables

Edit only the following variables in `default.js` with the values relevant to your environment:

| 🧩 **Variable**                                               | 💬 **Purpose**                                        | 🛠️ **Example**                                            |
| ------------------------------------------------------------ | ---------------------------------------------------- | -------------------------------------------------------- |
| `port`                                                       | Port for this service to run on                      | `3002`                                                   |
| `Analytics_stat_api_service`                                 | URL for the analytics/statistics API                 | `http://localhost:3000`                                  |
| `National_api_service`                                       | URL for the national carbon registry backend         | `http://localhost:3100`                                  |
| `Api_idea_note_manage_and_project_maps_intersection_service` | URL for maps/idea-note microservice                  | `http://localhost:3005`                                  |
| `app_token`, `eligi_token`                                   | Bearer tokens for secured communication              | `"Bearer xyz..."`                                        |
| `eligi_type_pay`                                             | Payment method ID used for eligibility workflows     | `"TYPE_PAIEMENT_..."`                                    |
| `user_example`                                               | A sample token value for demonstration or test use   | `"Bearer ..."`                                           |
| `admin[]`                                                    | List of local admin credentials                      | e.g., `"Admin/@bonjour"`                                 |
| `conf_bdd.uri`                                               | MongoDB connection URI                               | `"mongodb://127.0.0.1:27017/carbon_register_ci_landing"` |
| `user_auth.user` and `password`                              | Service-level authentication credentials             | `"your-username"` / `"your-password"`                    |
| `JWT_SECRET` & `JWT_SECRET_ELIGI`                            | JWT secrets used for secure session generation       | `"supersecret"`                                          |
| `JWT_Token_duration`                                         | Expiry time of JWT tokens (e.g., in seconds or `1h`) | `"3600"`                                                 |
| `Doc_server`, `intern_server`                                | Document viewer and internal routing                 | `"http://localhost:3000"`                                |
| `Doc_Token`                                                  | Access token for documents API                       | `"your-doc-token"`                                       |
| `contact_sender.title/sender`                                | Email sender name and address                        | `"Carbon Registry", "noreply@ci.org"`                    |
| `localisation_bmc`                                           | BMC contact and GPS metadata                         | `"Abidjan", GPS: `[5.3340038, -4.0227503]`               |
| `logo_link`                                                  | URL to logo displayed on the platform                | `"https://..."`                                          |
| `data_mailer.*`                                              | Email/SMTP configuration                             | `"smtp.gmail.com", user/pass`                            |
| `ia.api_key`, `ia.source`                                    | AI assistant configuration                           | `"YOUR_AI_TOKEN"`                                        |



### 🔄 Step 3: Install Dependencies

Return to the root of the project and run:

```bash
cd ../
npm install
```

------

### 🚀 Step 4: Start the Service

#### 🧪 For Development

```bash
node app.js
```

#### 🏭 For Production

```bash
npm install -g pm2
pm2 start app.js --name sign-plateform
```

------

### ✅ Service Ready!

Your **Signature & Document Platform** is now active and ready to process carbon project validations.

Parfait, voici une section prête à intégrer dans ton `README.md` qui explique clairement le rôle des dossiers `carbon_service_lib` et `carbon-library-main`, leur lien avec `carbon-registry-main`, et leur origine dans l’architecture du registre carbone du PNUD.

------

## 🧩 Custom Shared Libraries

The Côte d’Ivoire National Carbon Registry template includes two custom library modules that extend and customize the behavior of the base UNDP Carbon Registry:

```
undp-carbon-registry/
├── carbon_service_lib/
├── carbon-library-main/
├── carbon-registry-main/
```

### 🔹 `carbon_service_lib/`

This package contains **custom backend logic and utility functions** used by the `carbon-registry-main` module. It includes reusable services, business rules, and helper functions for API endpoints, user flows, and data processing.

- 🔁 **Integrated with**: `carbon-registry-main`
- 🔧 **Installed via**: `npm install` locally or from a private/public NPM registry
- 📦 **Used for**: Extending the backend business logic layer

### 🔹 `carbon-library-main/`

This package provides **shared frontend components and configuration utilities** for the `carbon-registry-main` user interface.

- 🎨 **Impacts**: React-based frontend of the registry
- 🔧 **Used by**:  React application in `carbon-registry-main`
- 📦 **Provides**: Custom UI widgets, validators, input formatters, and i18n helpers

> ⚠️ Both of these libraries were originally derived from the **UNDP Carbon Registry shared libraries** but have been **adapted specifically** for Côte d’Ivoire’s implementation to reflect local policies, workflows, and branding requirements.

------

## 🖥️ Resource Requirements

Before deploying the National Carbon Registry template, ensure your system meets the following minimum and recommended specifications:

| 🔧 **Resource**       | ✅ **Minimum**                                                | 🚀 **Recommended**                              |
| -------------------- | ------------------------------------------------------------ | ---------------------------------------------- |
| **Memory (RAM)**     | 4 GB                                                         | 8 GB or more                                   |
| **CPU**              | 4 Cores                                                      | 4 Cores (or higher clock speed)                |
| **Storage**          | 20 GB                                                        | 50 GB (SSD recommended)                        |
| **Operating System** | - Linux (Ubuntu 20.04+, Debian, CentOS) - Windows Server 2016 and later | - Linux (Ubuntu 22.04+) - Windows Server 2019+ |

> 💡 **Note**: For production environments, it's recommended to use **Linux-based servers** for better Docker compatibility and system performance.

------

## 👥 4. Authors and Acknowledgments

### 🧑‍💻 Main Contributors

This project was developed and customized as part of the **Côte d’Ivoire National Carbon Credit Registry** initiative.

- **Roger Doffou**
  *Lead Developer & Software Engineer*
  Skyvision Africa
  📧 [roger.doffou@skyvisionafrica.com](mailto:roger.doffou@skyvisionafrica.com)

- **Suini Olive**
  *Software Developer & Data Engineer*
  Skyvision Africa
  📧 [olive.suini@skyvisionafrica.com](mailto:olive.suini@skyvisionafrica.com)

- **Siriki Coulibaly**
  *Carbon Market Expert & Forestry Engineer*
  Skyvision Africa
  📧 [siriki.coulibaly@skyvisionafrica.com](mailto:siriki.coulibaly@skyvisionafrica.com)

- **Cédric Niamké**
  *Project Manager*
  Skyvision Africa
  📧 [cedric.niamke@skyvisionafrica.com](mailto:cedric.niamke@skyvisionafrica.com)

- **Rachel Douayou**
  *Executive Secretary, Carbon Market Bureau – Côte d’Ivoire*
  📍 Ministry of Environment and Sustainable Development

- **Aka Jean Paul Aka**
  *Team Leader, Environment*
  **UNDP Côte d’Ivoire**

- **Reina Otsuka**
  *Head of Climate Change Innovation and Digitalisation*
  **UNDP**

- **Dominique Mieguim Ngninpogni**
  *Digital Specialist, Climate & Environment*
  **UNDP**
  **Skyvision Africa Team**
  Custom integration, backend development, system deployment
  🌐 [https://skyvisionafrica.com](https://skyvisionafrica.com/)

- **UNDP – United Nations Development Programme**
  *Original developer of the Digital Public Good (DPG) Carbon Registry template*
  🌐 https://registry.digitalpublicgoods.net/undp-carbon-registry

  

## 📦 Built With

The project is built upon the **UNDP Digital Public Good (DPG) Carbon Registry**, and uses the following key technologies and libraries:

- 🟦 **Node.js** – Backend services and RESTful APIs
- ⚛️ **React (Vite + JSX)** – Fast and modern frontend interface
- 🐘 **PostgreSQL** – Relational data storage for core registry data
- 🍃 **MongoDB** – NoSQL storage for document metadata and supplementary services
- 🐳 **Docker & Docker Compose** – Simplified local and cloud container deployment
- 🧩 **carbon_service_lib** & **carbon-library-main** – Custom shared libraries for backend logic and frontend UI extensions (derived from the UNDP shared libraries)
- 🌍 **OpenLayers / Leaflet** – Geospatial mapping for project area visualization and overlap detection
- 🔐 **JWT + PM2** – Token-based authentication and process management for reliable production runtime

------

## 🙏 Acknowledgments

We would like to thank the following teams and individuals for their invaluable contributions and support:

- 💠 **UNDP Digital4Climate (D4C) team** – For designing and maintaining the open-source architecture that made this registry possible
- 🌿 **Ministry of Environment and Sustainable Development, Côte d’Ivoire** – For their collaboration, strategic alignment, and institutional leadership
- 🤝 **Contributors, reviewers, and test users** – Who provided feedback and validation during the deployment of the Côte d’Ivoire registry
- 🌐 **The open-source community** – For providing tools, documentation, and best practices that enriched this project
