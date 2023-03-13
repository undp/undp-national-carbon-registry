# Sample Terms of Reference
The TOR can be further specified if national details are known, e.g. about the NDC management tool. 
These worksteps can also be intergrated with larger TORs, especially TORs covering wider NDC management / transparency. Below are sample phrases that may be used. Generally a vendor (firm) or a group of individual consultant are encouraged, as the required skills vary. 

## 1. Installation
The following work steps are suggested for the national implementation of the DPG carbon registry in any country.

- Installation of a Carbon Registry from https://github.com/undp/carbon-registry

- Technical timeline/roadmap
- Fork the [Carbon Registry](https://github.com/undp/carbon-registry). Send pull requests to `staging` for added features (languages, security patchees, modules, etc.). 

- Initial Setup of the Carbon Registry, including localization to national requirements:
	- translation of text into relevant national languages
	- adjust colors, logos, maps, etc. to national standard
	- design graphics
	- purchase domain, hosting, & security certificate
	- register & connect supporting services (analytics, forms, etc.)
	- adjust sectors to match the sectors specified in the nationally determined contribution 
	- adjust maps to match local regions
	- adjust to local regulatory & legal requirements
	- integration with existing NDC management tools (if applicable) [API]
	- adjustment of user types to national requirements
	- creation of government accounts
	- status page for monitoring uptime, utlizing https://github.com/undp/carbon-registry-status 
	- *(Deliverable: Fully localized Carbon Registry running on staging (test) environment & productive (live) environment)*
 
- Build carbon credit calculators for locally-determined sectors & according to local regulations. Referencing https://github.com/undp/carbon-registry/tree/main/libs/carbon-credit-calculator . Push new calculators to main codebase.
- [Optional] Creation of new features / modules. Reporting update on https://github.com/undp/carbon-registry/tree/main/modules.
- - Successful end-to-end test of the registry. This test needs to cover the full lifecycle of one dummy project including at least project creation, authorization, implementation, MRV, issuance and transfer. 
*(Deliverable: Test Report)*
- Creation of a nationally appropriate signup proceedure for non-government accounts
- Hand over to official government use
*(Deliverable: Government Acceptance. Source code submission (ideally on `GitHub`) approved.)*
- Testing: Security, Privacy, Accessibility, Performance, Load. *(Deliverable: 3rd party and/or automated tests.)*
- Ticketing system: For submitting, tracking, & responding to platform requests & bugs.
- Warranty: Supporting long term web hosting and operation (DevOps) of the registry
- Training: interactive tutorial. manual. video/screen recording walkthrough. guidebook. workshops. help page. chatbot.
- Awareness: advertising. community outreach.

## 2. Scope of Work
-	Design
	-	User Interface (UI) Design
	-	Real-Time Reviewing & Commenting Mechanism
	-	Carbon Policy Guide
-	Quality Assurance (QA) & User Testing
	-	Internal Test with SME for the MVP version
-	Software Development
	-	Cloud-Based Containerized Web-Application for Desktop users
	-	DevOps, including Hosting Page
	-	Analytics
	-	Accessibility
-	Handover & Training
	-	Video/screen recording walkthrough
	-	Source code to be submitted to the official UNDP GitHub repository with full source documentation, use cases, and functional requirements.
-	Support & Maintenance
	-	x months of maintenance 
	-	y days per month are required
	-	Service Level Agreement (SLA): 


|Critical Level|	Response Time|	Resolution Time|
|---|---|---|
|Critical (System down)|	<10 mins|	<2 hours|
High|	<30 mins	<4 hours|
Medium| 	<4 hours|	<48 hours|
Low|	< 48 hours|	<3 days|
Planning| 	< 48 hours|	< 5 days|



## 3. Deliverables
- Deliverable 1: Governance: Strategy and Metrics, Policy and Compliance, Education and Guidance
- Deliverable 2: Design: User Interface, Graphics, Threat Assessment, Language Files, Security Requirements
- Deliverable 3: Implementation: Secure Build, Secure Deployment, Defect Management
- Deliverable 4: Verification: Architecture Assessment, Requirements-driven Testing, Security Testing
- Deliverable 5: Maintenance Operations [Incident Management, Environment Management, Operational Management]
- Deliverable 6: Distribution [Analytics, Advertising, Training]

(List developed with inspiration from [OWASP Software Assurance Maturity Model](https://owaspsamm.org/))

### Deliverable Requirements

- AGPL-3.0 software license
- UNDP Data Principles Adherence [https://data.undp.org/data-principles/](https://data.undp.org/data-principles/)
- Contributor Covenant Code of Conduct Adherence
- Reporting
- GDPR-compliant Analytics
- Notifications
  - Email notifications and reports
- Infrastructure
  - Cloud-based
  - Regular data export and/or backups
  - Staging & Production environments
  - DevOps
  - Status page
  - Domain & security certificate management
  - Containerized
- Accessibility Compliance (W3C)
- SEO Configuration: Schema.org standards
- Audit: Internal
- Multi-Language Support
- Ticketing system
- Service level agreement (SLA)
- Platform(s): Desktop Web
- Integrations
  - UNDP ITMO Platform
- Testing
  - Security audit: External
  - Privacy audit: Internal documentation of adherence to UNDP Data Principles
  - Functional tests: Automated scripts
  - Performance test: Internal
  - Interface test: User-based. (Including browser compatibility testing on Firefox, Chrome, Edge, and Safari for desktop, mobile and tablet including Windows 10+, MacOS, Android 9+ and iOS alongside responsive web design/screen size checking for 480px, >768px, >992px and >1200px, which covers Phones, Tablets, Desktops and Wide Screens)
- Code Package: Access rights to online git (Github, Gitlab, etc) code repository OR bundled in following file types: .git or .zip containing the full repository of files (such as .yml, .md, .sql, .json, .ts, .html, .svg, .js, etc. ). The latter can be shared via online file sharing services ([Send](https://send.vis.ee), Dropbox, Sharepoint, WeTransfer, etc) as the files will be too large to attach directly in email.

Other items to consider:
- Hosting / clound server:
- 	The ToR is based on the assumption that he government entity has or will prepare a hosting environment in a cloud server. If the government does not have a server space, consider if the vendor will need to host the registry. If so, consider if the vendor can be contracted for a long term. 
- 	Server specifications: TBD 

## 4. Required persons / skills
 - Developers (x2): 
	 - At least 5 years of previous working experience in Web development with front-end and back-end is required; 
	 - Previous experience with human-centered design and agile software development and methodology is preferred;
	 - Demonstrated experience in JavaScript, Html5, CSS3, (Angular; ReactJS; Vue.JS…) for front end development is strongly preferred
	 - Proven previous experience in API programming (NodeJS /PHP…) is an advantage
	 - Demonstrated experience in Database Development: e.g. MSSQL, MariaDB, MySQL, Oracle, PostgreSQL is an asset
	 - Demonstrated proficiency in DevOps: Azure DevOps, Docker, Git, Deployment pipeline, test automation is preferred
 - Project manager: 
	 - Minimum of 5 years of product management experience, with at least 2 years working in a startup environment
	 - Have shipped at least 1 digital product with proven impact.
	 - Been working with quantitative and qualitative Data
	 - Digitally competent and have a high drive for understanding and meeting users needs
	 - Experience in start-ups, with Agile methodology as well as UX are a plus but not a requirement
	 - Strong project manager and have experience in leading cross-functional project teams
	 - Ability to solve complicated problems and understanding end-customer needs are part of your core strengths

 - Carbon or stakeholder engagement expert - local and/or (optional)
 	- At least 5 years experience in climate policies, carbon markets and other green financing mechanisms are required
 	- Knowledge of digital technology or digitalization is strongly desired
 	- Direct experience related to mitigation outcome agreements at the national or international level is strongly desired
 	- Direct experience in developing or overseeing digital systems related to climate or carbon reporting, accounting, measurement, verification is strongly desired
 	- Experience in business development and entrepreneurship is an asset
 	
	## Deliverables in less digital jargon:
	- Deliverable: Fully localized Carbon Registry running on staging (test) environment & productive (live) environment
	- Deliverable: End to End Test Report
	- Deliverable: Government Acceptance. Source code submission (ideally on Git) approved.
	- Deliverable: 3rd party and/or automated tests.
	- Deliverable: Training: interactive tutorial. manual. video/screen recording walkthrough. guidebook. workshops. help page. chatbot.

	## Long Term Maintenance Tasks
	- Training of new Staff
	- Ticketing system: For submitting, tracking, & responding to platform requests & bugs.
	- Warranty: Supporting long term web hosting and operation (DevOps) of the registry
	- Awareness: advertising. community outreach.

