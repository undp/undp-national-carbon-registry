# Changelog

## v2.0 (2024-03-26)

### Breaking Changes

- **Update Project Create API Endpoint Payload Parameters:** The API endpoint for project creation has been updated with additional payload parameters.
    - Programme activity related fields
    - Set of additional documents
    - Supporting Owners field
    - Implementing User field

### Name Change

- **Programmes** has been renamed to **Project**.

### New Features

- **Project Creation from the Frontend:** Users now have the capability to create new projects directly from the frontend interface. This addition simplifies the project initiation process, making it more user-friendly and accessible.

- **Project Activities - Add and View:** It is now possible to add activities to projects and view these activities within the frontend.

- **Project Financing - Add and View:** Users can now add financing details to projects and access these financial insights easily.


## v2.0 (2025-03)

### Breaking Changes

- **Removed `carbon-services-lib` library**  
  All code related to the carbon registry has been migrated into this repository from `carbon-services-lib`.

- **Serial Number Format Update**  
  The serial number format has been updated to support individual token-level tracking.

- **Node.js Version Upgrade**  
  Node.js version has been upgraded from 16 to 20.

### Technical Changes

- **React Build Tool Migration from Craco to Vite**  
  The React application build tool has been switched to Vite for improved performance and faster builds.

### New Features

- **Removed Modules**
  - Financial modules have been removed.
  - Activity modules have been removed.

- **Dashboard Enhancements**
  - Refactored layout.
  - Added **My Pending Tasks** widget.

- **Project Ownership**
  - Project ownership now fully belongs to the project developer (no government share percentage).

- **AEF Reporting**
  - Added support for AEF reporting.

- **Authorization and Credit Issuance Flow**
  - Revised project authorization and credit issuance processes.

- **Project Details Page Enhancements**
  - Added an **Action Road Map** for each project.
  - **highlight the project location** on the map.
  - Enhanced **Activity Timeline** view.

- **Credit Section Revamp**
  - Added **Credit Balance** table.
  - Removed admin approval requirement for credit transfers.
  - Removed **Legal** and other **Retirement Types**.
  - Received credits can now be **transferred** and **retired**.
