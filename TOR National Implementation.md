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
	- integration with existing NDC management tools (if applicable) [API]
	- adjustment of user types to national requirements
	- creation of government accounts
	- status page for monitoring uptime, utlizing https://github.com/undp/carbon-registry-status 
	- *(Deliverable: Fully localized Carbon Registry running on staging (test) environment & productive (live) environment)*
 
- Successful end-to-end test of the registry. This test needs to cover the full lifecycle of one dummy project including at least project creation, authorization, implementation, MRV, issuance and transfer. 
*(Deliverable: Test Report)*
- Creation of a nationally appropriate signup proceedure for non-government accounts
- Hand over to official government use
*(Deliverable: Government Acceptance. Source code submission (ideally on `GitHub`) approved.)*
- Testing: Security, Privacy, Accessability. *(Deliverable: 3rd party and/or automated tests.)*
- Ticketing system: For submitting, tracking, & responding to platform requests & bugs.
- Warranty: Supporting long term web hosting and operation (DevOps) of the registry
- Training: manual. video/screen recording walkthrough. guidebook. workshops. 
- Awareness: advertising. community outreach.

Sample Terms of Reference
The TOR can be further specified if national details are known, e.g. about the NDC management tool. 
These worksteps can also be intergrated with larger TORs, especially TORs covering wider NDC management / transparency. Below are sample phrases that may be used. Generally a vendor (firm) or a group of individual consultant are encouraged, as the required skills vary. 

1. Scope of Work
-	Design
	-	User Interface (UI) Design
	-	Real-Time Reviewing & Commenting Mechanism
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



3. Deliverables
- Deliverable 1: 
- Deliverable 2:
- Deliverable 3:
- Deliverable 4: Maintenance of the registry (This is optional, however highly recommended to ensure upgrade and security checks)

## Deliverable Requirements

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
- Audit: Internal
- Multi-Language Support
- Ticketing system
- Service level agreement (SLA)
- Platform(s): Desktop Web
- Integrations
  - UNDP ITMO Platform
- Privacy & Security
  - Security audit: External
  - Privacy audit: Internal documentation of adherence to UNDP Data Principles

Other items to consider:
- Hosting / clound server:
- 	The ToR is based on the assumption that he government entity has or will prepare a hosting environment in a cloud server. If the government does not have a server space, consider if the vendor will need to host the registry. If so, consider if the vendor can be contracted for a long term. 
- 	Server specifications: TBD 

4. Required persons / skills
 - Developers (x2): 
	 - At least 5 years of previous working experience in Web development with front-end and back-end is required; 
	 - Previous experience with human-centered design and agile software development and methodology is preferred;
	 - Demonstrated experience in JavaScript, Html5, CSS3, (Angular; ReactJS; Vue.JS…) for front end development is strongly preferred
	 - Proven previous experience in API programming (NodeJS /PHP…) is an advantage
	 - Demonstrated experience in Database Development: e.g. MSSQL, MariaDB, MySQL, Oracle, PostgreSQL is an asset
	 - Demonstrated proficiency in DevOps: Azure DevOps, Docker, Git, Deployment pipeline, test automation is preferred
 - Project manager: 
 - Carbon or stakeholder engagement expert - local and/or (optional)
 	- At least 5 years experience in climate policies, carbon markets and other green financing mechanisms are required
 	- Knowledge of digital technology or digitalization is strongly desired
 	- Direct experience related to mitigation outcome agreements at the national or international level is strongly desired
 	- Direct experience in developing or overseeing digital systems related to climate or carbon reporting, accounting, measurement, verification is strongly desired
 	- Experience in business development and entrepreneurship is an asset
