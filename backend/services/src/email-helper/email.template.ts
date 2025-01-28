export const EmailTemplates = {
  ORGANISATION_CREATE: {
    id: "ORGANISATION_CREATE",
    subject: "Welcome!",
    html: `
        Welcome {{organisationName}},<br><br>
        Your Organisation has been registered with the {{countryName}} {{systemName}} as a {{organisationRole}} Organisation. <br><br>
        Explore the System <a href="{{home}}">here</a>. <br><br>

        Sincerely,<br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  ORGANISATION_REGISTRATION: {
    id: "ORGANISATION_REGISTRATION",
    subject: "Organisation Registration Request",
    html: `
        Hi {{name}},<br><br>

        New Organisation {{organisationName}} has requested to register with the {{countryName}} {{systemName}} as a {{organisationRole}} Organisation. <br><br> 
        Click <a href="{{organisationPageLink}}">here</a> for more details of the Organisation.

        <br><br>
        Sincerely,<br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  ORGANISATION_REGISTRATION_REJECTED: {
    id: "ORGANISATION_REGISTRATION_REJECTED",
    subject: "Organisation Registration Request Rejected",
    html: `
        Hi {{name}},<br><br>

        Registration request made by your Organisation to register with the {{countryName}} {{systemName}} as a {{organisationRole}} Organisation has been rejected due to the following reason/s:<br>
        {{remarks}}

        <br><br>
        Sincerely,<br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  USER_CREATE: {
    id: "USER_CREATE",
    subject: "Welcome!",
    html: `
        Welcome {{name}}, <br><br>

        Thank you for supporting the {{countryName}} {{systemName}}.<br><br>

        Your account has been created on: <a href="{{home}}">{{home}}</a> <br>
        User: {{email}} <br>
        Password (temporary): {{tempPassword}} <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Registry Team <br><br>
        `,
    text: "",
  },
  API_KEY_EMAIL: {
    id: "API_KEY_EMAIL",
    subject: "Carbon Credit Registry API Key Generation",
    html: `
        Hi {{name}},<br><br>

        You carbon registry account api key regenerated  - {{apiKey}}.
        <br><br>
        Sincerely,<br>
        The Carbon Credit Registry Team
    `,
    text: "",
  },
  RETIRE_REQUEST: {
    subject: "Retire Request Received",
    html: `
        Hi {{name}},<br><br>

        {{requestedCompany}} has requested to retire {{credits}} credits with the serial number {{serialNo}} from {{programmeName}}.

        <br><br>
        Sincerely,<br>
        The Carbon Credit Registry Team
        `,
    text: "",
  },
  CHANGE_PASSOWRD: {
    id: "CHANGE_PASSOWRD",
    subject: "Your Password was Changed",
    html: `
        Hi {{name}},<br><br>
        The password of your Carbon Registry account was changed successfully. <br><br>
        If you do not use {{countryName}} Carbon Credit Registry or did not request a password reset, please ignore this email or
        <a href="mailto:help@carbreg.org?subject=Password Problem with the {{countryName}} Carbon Credit Registry">contact support</a>
        if you have questions.

        <br><br>
        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
    text: "",
  },
  FORGOT_PASSOWRD: {
    id: "FORGOT_PASSOWRD",
    subject: "Password Reset Request",
    html: `
        Hi {{name}},<br><br>
        We received a request to reset your Carbon Registry password. <br><br>
        Use the link below to set a new password for your account. This password reset is only valid for the next hour.
        <br><br>

        <a href="{{home}}/resetPassword/{{requestId}}">Click here to reset the password</a>
        <br><br>

        If you do not use {{countryName}} Carbon Credit Registry or did not request a password reset, please ignore this email or
        <a href="mailto:help@carbreg.org?subject=Password Problem with the {{countryName}} Carbon Credit Registry">contact support</a>
        if you have questions.

        <br><br>
        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
    text: "",
  },
  PROGRAMME_CREATE: {
    id: "PROGRAMME_CREATE",
    subject: "New Project Created",
    html: `
        Hi {{name}}, <br><br>

        A new project owned by {{organisationName}} has been created in the Carbon Registry. <br><br>

        Click <a href="{{programmePageLink}}">here</a> for more details of the project.
        <br><br>

        Sincerely,  <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  PROGRAMME_SL_CREATE: {
    id: "PROGRAMME_SL_CREATE",
    subject: "New Initial Notification Submitted!",
    html: `
        Hi {{name}}, <br><br>

        A new Initial Notification form has been submitted, by {{organisationName}} organisation. <br><br>

        Please review and approve by clicking <a href="{{programmePageLink}}">here</a>.
        <br><br>

        Sincerely,  <br>
        The {{countryName}} Carbon Registry Team
        `,
  },
  PROGRAMME_SL_APPROVED: {
    id: "PROGRAMME_SL_APPROVED",
    subject: "Initial Notification Approved",
    html: `
        Hi {{name}}, <br><br>

        Your initial notification form has been approved by Zimbabwe Climate Fund. <br><br>

        Click <a href="{{programmePageLink}}">here</a> for more details of the project.
        <br><br>

        Sincerely,  <br>
        The {{countryName}} Carbon Registry Team
        `,
  },
  PROGRAMME_SL_REJECTED: {
    id: "PROGRAMME_SL_REJECTED",
    subject: "Initial Notification Rejected",
    html: `
        Hi {{name}}, <br><br>

        Initial notification submitted by your {{organisationName}} organisation has been rejected by Sri Lanka Climate Fund due to the following reason/s:<br>
        {{remark}} <br><br>

        Please submit a new notification request.
        <br><br>

        Sincerely,  <br>
        The {{countryName}} Carbon Registry Team
        `,
  },
  PROJECT_PROPOSAL_SUBMITTED: {
    id: "PROJECT_PROPOSAL_SUBMITTED",
    subject: "New Proposal Submitted!",
    html: `
        Hi {{name}}, <br><br>

        Cost Quotation Form, Proposal Form and Validation Agreement for the project {{programmeName}} have been submitted by Zimbabwe Climate Fund. <br><br>

        Please review and accept by clicking <a href="{{programmePageLink}}">here</a>.
        <br><br>

        Sincerely,  <br>
        The {{countryName}} Carbon Registry Team
        `,
  },
  PROJECT_PROPOSAL_ACCEPTED: {
    id: "PROJECT_PROPOSAL_ACCEPTED",
    subject: "Proposal Accepted",
    html: `
        Hi {{name}}, <br><br>

        Cost Quotation Form, Proposal Form and Validation Agreement submitted by Zimbabwe Climate Fund for the project {{programmeName}} owned by {{organisationName}} have been accepted by {{organisationName}}. <br><br>

        Click <a href="{{programmePageLink}}">here</a> for more details of the project.
        <br><br>

        Sincerely,  <br>
        The {{countryName}} Carbon Registry Team
        `,
  },
  PROJECT_PROPOSAL_REJECTED: {
    id: "PROJECT_PROPOSAL_REJECTED",
    subject: "Proposal Rejected",
    html: `
        Hi {{name}}, <br><br>

        Cost Quotation Form, Proposal Form and Validation Agreement submitted by Sri Lanka Climate Fund for the project {{programmeName}} owned by {{organisationName}} have been rejected by {{organisationName}} due to the following reason/s:<br>
        {{remark}}<br><br>


        Click <a href="{{programmePageLink}}">here</a> for more details of the project.
        <br><br>

        Sincerely,  <br>
        The {{countryName}} Carbon Registry Team
        `,
  },
  CMA_CREATE: {
    id: "CMA_CREATE",
    subject: "New Carbon Management Assessment Form Submitted",
    html: `
        Hi {{name}}, <br><br>

        A new Carbon Management Assessment form has been submitted, for the project {{programmeName}}, by {{organisationName}} organisation. <br><br>

        Please review and approve by clicking <a href="{{programmePageLink}}">here</a>.
        <br><br>

        Sincerely,  <br>
        The {{countryName}} Carbon Registry Team
        `,
  },
  CMA_APPROVED: {
    id: "CMA_APPROVED",
    subject: "Carbon Management Assessment Approved",
    html: `
        Hi {{name}}, <br><br>

        Carbon Management Assessment submitted for the project {{programmeName}} by your {{organisationName}} organisation has been approved by Zimbabwe Climate Fund. <br><br>

        Click <a href="{{programmePageLink}}">here</a> for more details of the form.
        <br><br>

        Sincerely,  <br>
        The {{countryName}} Carbon Registry Team
        `,
  },
  CMA_REJECTED: {
    id: "CMA_REJECTED",
    subject: "Carbon Management Assessment Rejected",
    html: `
        Hi {{name}}, <br><br>

        Carbon Management Assessment submitted for the project {{programmeName}} by your {{organisationName}} organisation has been rejected by Sri Lanka Climate Fund due to the following reason/s:<br>
        {{remark}} <br><br>

        Please re-submit the Carbon Management Assessment form by clicking <a href="{{programmePageLink}}">here</a>.
        <br><br>

        Sincerely,  <br>
        The {{countryName}} Carbon Registry Team
        `,
  },
  VALIDATION_SUBMITTED: {
    id: "VALIDATION_SUBMITTED",
    subject: "New Validation Report Submitted!",
    html: `
        Hi {{name}}, <br><br>

        A new Validation Report has been submitted by Zimbabwe Climate Fund for the project {{programmeName}} owned by {{organisationName}}. <br><br>

        Please review and approve by clicking <a href="{{programmePageLink}}">here</a>.
        <br><br>

        Sincerely,  <br>
        The {{countryName}} Carbon Registry Team
        `,
  },
  VALIDATION_APPROVED: {
    id: "VALIDATION_APPROVED",
    subject: "Validation Report Approved",
    html: `
        Hi {{name}}, <br><br>

        Validation Report submitted for the project {{programmeName}} by Zimbabwe Climate Fund has been approved by Executive Board of Zimbabwe Climate Fund. <br><br>

        Now the project has been authorised.

        Please click <a href="{{programmePageLink}}">here</a> to download the issued Project Registration Certificate.
        <br><br>

        Please proceed to the next phase and submit the Monitoring Report.<br><br>

        Sincerely,  <br>
        The {{countryName}} Carbon Registry Team
        `,
  },
  VALIDATION_REJECTED: {
    id: "VALIDATION_REJECTED",
    subject: "Validation Report Rejected",
    html: `
        Hi {{name}}, <br><br>

        Validation report submitted for the project {{programmeName}} owned by {{organisationName}} organisation has been rejected by Executive Board of Sri Lanka Climate Fund due to the following reason/s:<br>
        {{remark}} <br><br>

        Please submit again by clicking <a href="{{programmePageLink}}">here</a>.
        <br><br>

        Sincerely,  <br>
        The {{countryName}} Carbon Registry Team
        `,
  },
  MONITORING_CREATE: {
    id: "MONITORING_CREATE",
    subject: "New Monitoring Report Submitted!",
    html: `
        Hi {{name}}, <br><br>

        A new Monitoring Report has been submitted by {{organisationName}} for the project {{programmeName}}. <br><br>

        Please review and approve by clicking <a href="{{programmePageLink}}">here</a>.
        <br><br>

        Sincerely,  <br>
        The {{countryName}} Carbon Registry Team
        `,
  },
  MONITORING_APPROVED: {
    id: "MONITORING_APPROVED",
    subject: "Monitoring Report Approved",
    html: `
        Hi {{name}}, <br><br>

        Monitoring Report submitted for the project {{programmeName}} by your {{organisationName}} organisation has been approved by Zimbabwe Climate Fund. <br><br>

        Click <a href="{{programmePageLink}}">here</a> to be directed to create the Verification Report.
        <br><br>

        Sincerely,  <br>
        The {{countryName}} Carbon Registry Team
        `,
  },
  MONITORING_REJECTED: {
    id: "MONITORING_REJECTED",
    subject: "Monitoring Report Rejected",
    html: `
        Hi {{name}}, <br><br>

        Monitoring Report submitted for the project {{programmeName}} by your {{organisationName}} organisation has been rejected by Sri Lanka Climate Fund due to the following reason/s:<br>
        {{remark}} <br><br>

        Please submit again by clicking <a href="{{programmePageLink}}">here</a>.
        <br><br>

        Sincerely,  <br>
        The {{countryName}} Carbon Registry Team
        `,
  },
  VERIFICATION_CREATE: {
    id: "VERIFICATION_CREATE",
    subject: "New Verification Report Submitted!",
    html: `
        Hi {{name}}, <br><br>

        A new Verification Report has been submitted, for the organisation {{organisationName}} for the project {{programmeName}}. <br><br>

        Please review and approve by clicking <a href="{{programmePageLink}}">here</a>.
        <br><br>

        Sincerely,  <br>
        The {{countryName}} Carbon Registry Team
        `,
  },
  VERIFICATION_APPROVED: {
    id: "VERIFICATION_APPROVED",
    subject: "Verification Report Approved",
    html: `
        Hi {{name}}, <br><br>

        Verification Report submitted for the project {{programmeName}} by the Zimbabwe Climate Fund has been approved by Executive Board of Zimbabwe Climate Fund. <br><br>

        Please request for the credits transfer or retirement accordingly. 
        <br><br>

        Sincerely,  <br>
        The {{countryName}} Carbon Registry Team
        `,
  },
  VERIFICATION_REJECTED: {
    id: "VERIFICATION_REJECTED",
    subject: "Verification Report Rejected",
    html: `
        Hi {{name}}, <br><br>

        Verification Report submitted for the project {{programmeName}} by the Sri Lanka Climate Fund has been rejected by Executive Board of Sri Lanka Climate Fund due to the following reason/s:<br>
        {{remark}} <br><br>

        Please submit again if required by clicking <a href="{{programmePageLink}}">here</a>. 
        <br><br>

        Sincerely,  <br>
        The {{countryName}} Carbon Registry Team
        `,
  },
  PROGRAMME_AUTHORISATION: {
    id: "PROGRAMME_AUTHORISATION",
    subject: "Project Authorised",
    html: `
        Hi {{name}},  <br><br>

        {{programmeName}}  of your Organisation has been authorised on {{authorisedDate}} with the serial number {{serialNumber}}.
        <br><br>

        Click <a href="{{programmePageLink}}">here</a> for more details of the project.
        <br><br>

        Sincerely,  <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  PROGRAMME_REJECTION: {
    id: "PROGRAMME_REJECTION",
    subject: "Project Rejected",
    html: `
        Hi {{name}}, <br><br>

        {{programmeName}} of your Organisation has been rejected on {{date}} due to the following reason/s: <br>
        {{reason}} <br><br>

        Click <a href="{{pageLink}}">here</a> for more details of the project.  <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  DOCUMENT_APPROVED: {
    id: "DOCUMENT_APPROVED",
    subject: "Document Approved",
    html: `
        Hi {{name}}, <br><br>

        The {{documentType}} of the project {{programmeName}} owned by your organisation has been approved. <br><br>
        
        Click <a href="{{programmePageLink}}">here</a> for more details of the project. 
        <br><br>
         
        Sincerely,  <br>
        The {{countryName}} Carbon Credit Registry Team 
        `,
  },
  CREDIT_ISSUANCE: {
    id: "CREDIT_ISSUANCE",
    subject: "Credits Issued",
    html: `
        Hi {{name}}, <br><br>

        {{programmeName}} of your Organisation with the serial number {{serialNumber}} has been issued with {{credits}} credits.<br><br>

        Click <a href="{{pageLink}}">here</a> for more details of the project.<br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  CREDIT_TRANSFER_REQUISITIONS: {
    id: "CREDIT_TRANSFER_REQUISITIONS",
    subject: "Transfer Request Received",
    html: `
        Hi {{name}}, <br><br>

        {{organisationName}} has requested to transfer {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}}.<br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the transfer request.<br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  CREDIT_TRANSFER_CANCELLATION: {
    id: "CREDIT_TRANSFER_CANCELLATION",
    subject: "Transfer Request Cancelled",
    html: `
        Hi {{name}}, <br><br>

        Request to transfer {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}} made by {{organisationName}} has been cancelled.<br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the transfer request.<br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  CREDIT_TRANSFER_CANCELLATION_SYS_TO_INITIATOR: {
    id: "CREDIT_TRANSFER_CANCELLATION_SYS_TO_INITIATOR",
    subject: "Transfer Request Cancelled by the System",
    html: `
      Hi {{name}}, <br><br>

      Request to transfer {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}} to {{organisationName}} made by your Organisation has been cancelled due to insufficient credits available. <br><br>
      Click <a href="{{pageLink}}">here</a> for more details of the transfer request. <br><br>

      Sincerely, <br>
      The {{countryName}} Carbon Credit Registry Team
    `,
  },
  CREDIT_TRANSFER_CANCELLATION_SYS_TO_SENDER: {
    id: "CREDIT_TRANSFER_CANCELLATION_SYS_TO_SENDER",
    subject: "Transfer Request Cancelled by the System",
    html: `
      Hi {{name}}, <br><br>

      Request to transfer {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}} to {{organisationName}} made by {{initiatorOrganisationName}} has been cancelled due to insufficient credits available. <br><br>
      Click <a href="{{pageLink}}">here</a> for more details of the transfer request. <br><br>

      Sincerely, <br>
      The {{countryName}} Carbon Credit Registry Team
    `,
  },
  CREDIT_TRANSFER_ACCEPTED: {
    id: "CREDIT_TRANSFER_ACCEPTED",
    subject: "Transfer Request Accepted",
    html: `
        Hi {{name}}, <br><br>

        Request to transfer {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}} made by your Organisation has been accepted by {{organisationName}}.<br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the transfer request. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  CREDIT_TRANSFER_REJECTED: {
    id: "CREDIT_TRANSFER_REJECTED",
    subject: "Transfer Request Rejected",
    html: `
        Hi {{name}}, <br><br>

        Request to transfer {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}}
        made by your Organisation has been rejected by {{organisationName}}.<br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the transfer request. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team`,
  },
  CREDIT_TRANSFER_GOV: {
    id: "CREDIT_TRANSFER_GOV",
    subject: "Transfer Request Received",
    html: `
        Hi {{name}}, <br><br>

        {{government}} has requested your Organisation to transfer {{credits}} credits with the serial number {{serialNumber}}
         from {{programmeName}} to {{organisationName}}. <br><br>

        Click <a href="{{pageLink}}">here</a> for more details of the transfer request. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  CREDIT_TRANSFER_GOV_CANCELLATION: {
    id: "CREDIT_TRANSFER_GOV_CANCELLATION",
    subject: "Transfer Request Cancelled",
    html: `
        Hi {{name}},<br><br>

        Request to transfer {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}}
        to {{organisationName}} made by {{government}} has been cancelled. <br><br>

        Click <a href="{{pageLink}}">here</a> for more details of the transfer request. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  CREDIT_TRANSFER_GOV_ACCEPTED_TO_INITIATOR: {
    id: "CREDIT_TRANSFER_GOV_ACCEPTED_TO_INITIATOR",
    subject: "Transfer Request Accepted",
    html: `
        Hi {{name}},<br><br>

        Request to transfer {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}} made by your Organisation has been accepted by {{organisationName}}. <br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the transfer request.<br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  CREDIT_TRANSFER_GOV_ACCEPTED_TO_RECEIVER: {
    id: "CREDIT_TRANSFER_GOV_ACCEPTED_TO_RECEIVER",
    subject: "Credits Received",
    html: `
        Hi {{name}},<br><br>

        {{organisationName}} has transferred {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}} to your Organisation by accepting the request made by the {{government}}.<br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the transfer request <br> <br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  CREDIT_TRANSFER_GOV_REJECTED: {
    id: "CREDIT_TRANSFER_GOV_REJECTED",
    subject: "Transfer Request Rejected",
    html: `
        Hi {{name}},<br><br>

        Request to transfer {{credits}}  credits with the serial number {{serialNumber}} from {{programmeName}} made by your Organisation has been rejected by {{organisationName}}. <br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the transfer request <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  CREDIT_SEND_DEVELOPER: {
    id: "CREDIT_SEND_DEVELOPER",
    subject: "Credits Received",
    html: `
        Hi {{name}},<br><br>

        {{organisationName}} has transferred {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}} to your Organisation.<br><br>

        Click <a href="{{pageLink}}">here</a> for more details of the transfer request. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  PROGRAMME_APPROVED: {
    id: "PROGRAMME_APPROVED",
    subject: "New Project Received for Authorisation",
    html: `
        Hi {{name}},<br><br>

        A new project owned by {{organisationName}} is awaiting authorisation. <br><br>

        Click <a href="{{programmePageLink}}">here</a> to access all the projects that require authorisation. <br><br>
        
        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  PROGRAMME_CERTIFICATION: {
    id: "PROGRAMME_CERTIFICATION",
    subject: "Project Certified by {{organisationName}}",
    html: `
        Hi {{name}},<br><br>

        The {{programmeName}} containing {{credits}} credits with the serial number {{serialNumber}} of your Organisation has been certified by {{organisationName}}. <br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the certification. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  NON_AUTHORIZED_PROGRAMME_CERTIFICATION: {
    id: "NON_AUTHORIZED_PROGRAMME_CERTIFICATION",
    subject: "Project Certified by {{organisationName}}",
    html: `
        Hi {{name}},<br><br>

        The project with name {{programmeName}}, of your Organisation has been certified by {{organisationName}}. <br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the certification. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  PROGRAMME_CERTIFICATION_REVOKE_BY_CERT: {
    id: "PROGRAMME_CERTIFICATION_REVOKE_BY_CERT",
    subject: "Project Certificate Revoked by {{organisationName}}",
    html: `
        Hi {{name}},<br><br>

        The certification of the project {{programmeName}} containing {{credits}} credits with the serial number {{serialNumber}} has been revoked by {{organisationName}}. <br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the certification. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  NON_AUTHORIZED_PROGRAMME_CERTIFICATION_REVOKE_BY_CERT: {
    id: "NON_AUTHORIZED_PROGRAMME_CERTIFICATION_REVOKE_BY_CERT",
    subject: "Project Certificate Revoked by {{organisationName}}",
    html: `
        Hi {{name}},<br><br>

        The certification of the project {{programmeName}} has been revoked by {{organisationName}}. <br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the certification. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  PROGRAMME_CERTIFICATION_REVOKE_BY_GOVT_TO_PROGRAMME: {
    id: "PROGRAMME_CERTIFICATION_REVOKE_BY_GOVT_TO_PROGRAMME",
    subject: "Project Certificate Revoked by {{government}}",
    html: `
        Hi {{name}},<br><br>

        The certification given by {{organisationName}} for the project {{programmeName}} containing {{credits}} credits with the serial number {{serialNumber}} has been revoked by the {{government}}. <br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the certification. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  NON_AUTHORIZED_PROGRAMME_CERTIFICATION_REVOKE_BY_GOVT_TO_PROGRAMME: {
    id: "NON_AUTHORIZED_PROGRAMME_CERTIFICATION_REVOKE_BY_GOVT_TO_PROGRAMME",
    subject: "Project Certificate Revoked by {{government}}",
    html: `
        Hi {{name}},<br><br>

        The certification given by {{organisationName}} for the project {{programmeName}} has been revoked by the {{government}}. <br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the certification. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  PROGRAMME_CERTIFICATION_REVOKE_BY_GOVT_TO_CERT: {
    id: "PROGRAMME_CERTIFICATION_REVOKE_BY_GOVT_TO_CERT",
    subject: "Project Certificate Revoked by {{government}}",
    html: `
        Hi {{name}},<br><br>

        The certification given by your Organisation for the project {{programmeName}} containing {{credits}} credits with the serial number {{serialNumber}} has been revoked by the {{government}}. <br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the certification. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  NON_AUTHORIZED_PROGRAMME_CERTIFICATION_REVOKE_BY_GOVT_TO_CERT: {
    id: "NON_AUTHORIZED_PROGRAMME_CERTIFICATION_REVOKE_BY_GOVT_TO_CERT",
    subject: "Project Certificate Revoked by {{government}}",
    html: `
        Hi {{name}},<br><br>

        The certification given by your Organisation for the project {{programmeName}} has been revoked by the {{government}}. <br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the certification. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  PROGRAMME_CERTIFICATION_REVOKE_BY_SYSTEM: {
    id: "PROGRAMME_CERTIFICATION_REVOKE_BY_SYSTEM",
    subject: "Project Certificate Revoked by the System",
    html: `
        Hi {{name}},<br><br>

        The certification given by {{organisationName}} for the project {{programmeName}} containing {{credits}} credits with the serial number {{serialNumber}} has been revoked by the system as {{organisationName}} was deactivated. <br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the certification. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  NON_AUTHORIZED_PROGRAMME_CERTIFICATION_REVOKE_BY_SYSTEM: {
    id: "NON_AUTHORIZED_PROGRAMME_CERTIFICATION_REVOKE_BY_SYSTEM",
    subject: "Project Certificate Revoked by the System",
    html: `
        Hi {{name}},<br><br>

        The certification given by {{organisationName}} for the project {{programmeName}} has been revoked by the system as {{organisationName}} was deactivated. <br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the certification. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  PROGRAMME_DEVELOPER_ORG_DEACTIVATION: {
    id: "PROGRAMME_DEVELOPER_ORG_DEACTIVATION",
    subject: "Organisation Deactivated",
    html: `
        Hi,<br><br>

        Your Organisation has been deactivated by the {{government}}. Your Organisation will still be visible but no further action will be able to take place. Following were the effects of deactivation:<br><br>
         · All the users of the Organisation were deactivated. <br>
         · All the credits owned by your Organisation were frozen.<br>
         · All credit transfer requests sent and received by your Organisation were cancelled.<br>
         · All the international transfer retire requests sent by your Organisation were cancelled.<br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  CERTIFIER_ORG_DEACTIVATION: {
    id: "CERTIFIER_ORG_DEACTIVATION",
    subject: "Organisation Deactivated",
    html: `
        Hi,<br><br>

        Your Organisation has been deactivated by the {{government}}. Your Organisation will still be visible but no further action will be able to take place. Following are the effects of deactivation: <br><br>
        · All the users of the Organisation were deactivated.<br>
        · All the certificates given by your Organisation were revoked. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  CREDIT_RETIREMENT_BY_GOV: {
    id: "CREDIT_RETIREMENT_BY_GOV",
    subject: "Credits Retired",
    html: `
        Hi {{name}},<br><br>

        {{credits}} credits of the project {{programmeName}} with the serial number {{serialNumber}} has been retired by the {{government}} as {{reason}}{{omgeRetireDesc}}.<br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the retirement. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  CREDIT_RETIREMENT_BY_DEV: {
    id: "CREDIT_RETIREMENT_BY_DEV",
    subject: "International Transfer Retire Request Received",
    html: `
        Hi {{name}},<br><br>

        {{organisationName}} has requested an international transfer retirement of {{credits}} credits and Overall Mitigation in Global Emission of {{omgeCredits}} credits with the serial number {{serialNumber}} from {{programmeName}}. <br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the international transfer retire request. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  CREDIT_RETIREMENT_CANCEL: {
    id: "CREDIT_RETIREMENT_CANCEL",
    subject: "International Transfer Retire Request Cancelled",
    html: `
        Hi {{name}},<br><br>

        Request to internationally transfer {{credits}} credits and Overall Mitigation in Global Emission of {{omgeCredits}} credits with the serial number {{serialNumber}} from {{programmeName}} to {{country}} made by {{organisationName}} has been cancelled.<br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the international transfer retire request. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  CREDIT_RETIREMENT_CANCEL_SYS_TO_INITIATOR: {
    id: "CREDIT_RETIREMENT_CANCEL_SYS_TO_INITIATOR",
    subject: "International Transfer Retire Request Cancelled by the System",
    html: `
      Hi {{name}},<br><br>
      Request to internationally transfer {{credits}} credits and Overall Mitigation in Global Emission of {{omgeCredits}} credits with the serial number {{serialNumber}} from {{programmeName}} to {{country}} made by your Organisation has been cancelled by the system due to insufficient credits available. <br><br>
      Click <a href="{{pageLink}}">here</a> for more details of the international transfer retire request. <br><br>

      Sincerely,  <br>
      The {{countryName}} Carbon Credit Registry Team
    `,
  },
  CREDIT_RETIREMENT_CANCEL_SYS_TO_GOV: {
    id: "CREDIT_RETIREMENT_CANCEL_SYS_TO_GOV",
    subject: "International Transfer Retire Request Cancelled by the System",
    html: `
      Hi {{name}},<br><br>
      Request to internationally transfer {{credits}} credits and Overall Mitigation in Global Emission of {{omgeCredits}} credits with the serial number {{serialNumber}} from {{programmeName}} to {{country}} made by {{organisationName}} has been cancelled by the system due to insufficient credits available. <br><br>
      Click <a href="{{pageLink}}">here</a> for more details of the international transfer retire request. <br><br>

      Sincerely,  <br>
      The {{countryName}} Carbon Credit Registry Team
    `,
  },
  CREDIT_RETIREMENT_RECOGNITION: {
    id: "CREDIT_RETIREMENT_RECOGNITION",
    subject: "International Transfer Retire Request Recognised",
    html: `
        Hi {{name}},<br><br>

        Request to internationally transfer {{credits}} credits and Overall Mitigation in Global Emission of {{omgeCredits}} credits with the serial number {{serialNumber}} from {{programmeName}} to {{country}} made by your Organisation has been recognised.<br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the international transfer retire request. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  CREDIT_RETIREMENT_NOT_RECOGNITION: {
    id: "CREDIT_RETIREMENT_NOT_RECOGNITION",
    subject: "International Transfer Retire Request Not Recognised",
    html: `
        Hi {{name}},<br><br>

        Request to internationally transfer {{credits}} credits and Overall Mitigation in Global Emission of {{omgeCredits}} credits with the serial number {{serialNumber}} from {{programmeName}} to {{country}} made by your Organisation has not been recognised.<br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the international transfer retire request. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  ORG_REACTIVATION: {
    id: "ORG_REACTIVATION",
    subject: "Organisation Reactivated",
    html: `
        Hi <br><br>

        Your Organisation has been reactivated by the {{government}}. Your Organisation will be able to perform actions as before and all the users of the Organisation will be reactivated.  <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  CREDIT_ISSUANCE_SL: {
    id: "CREDIT_ISSUANCE",
    subject: "Credits Issued",
    html: `
        Hi {{name}}, <br><br>

        {{programmeName}} of your organisation with the serial number {{serialNumber}} has been issued with {{credits}} credits.<br><br>

        Click <a href="{{pageLink}}">here</a> for more details of the project.<br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Registry Team
        `,
  },

  CREDIT_TRANSFER_SL_REQUEST: {
    id: "CREDIT_TRANSFER_SL_REQUEST",
    subject: "Credit Transfer Request Received",
    html: `
        Hi {{name}}, <br><br>

        {{organisationName}} has requested to transfer {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}}.<br><br>
        Please review and approve by clicking <a href="{{pageLink}}">here</a>.<br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Registry Team
        `,
  },

  CREDIT_RETIRE_SL_REQUEST: {
    id: "CREDIT_RETIRE_SL_REQUEST",
    subject: "Credit Retirement Request Received",
    html: `
        Hi {{name}}, <br><br>

        {{organisationName}} has requested to retire {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}}.<br><br>
        Please review and approve by clicking <a href="{{pageLink}}">here</a>.<br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Registry Team
        `,
  },

  CREDIT_TRANSFER_SL_REQUEST_APPROVED: {
    id: "CREDIT_TRANSFER_SL_REQUEST_APPROVED",
    subject: "Credit Transfer Request Approved",
    html: `
        Hi {{name}},<br><br>

        Request to transfer {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}} made by your organisation has been approved by {{countryName}} Climate Fund. <br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the transfer request <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Registry Team
        `,
  },

  CREDIT_RECEIVED_AND_RETIRED_SL: {
    id: "CREDIT_RECEIVED_AND_RETIRED_SL",
    subject: "Credit Received and Retired",
    html: `
        Hi {{name}},<br><br>

        {{fromCompany}} has transferred {{credits}} credits from {{programmeName}} to your organisation. {{credits}} tCO2e emissions have been inset from your organisation. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Registry Team
        `,
  },

  CREDIT_RETIRE_SL_REQUEST_APPROVED: {
    id: "CREDIT_RETIRE_SL_REQUEST_APPROVED",
    subject: "Credit Retirement Request Approved",
    html: `
        Hi {{name}},<br><br>

        Request to retire {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}} made by your organisation has been approved by {{countryName}} Climate Fund. <br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the retirement request <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Registry Team
        `,
  },

  CREDIT_TRANSFER_SL_REQUEST_REJECTED: {
    id: "CREDIT_TRANSFER_SL_REQUEST_REJECTED",
    subject: "Credit Transfer Request Declined",
    html: `
        Hi {{name}},<br><br>

        Request to transfer {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}} made by your organisation has been rejected by {{countryName}} Climate Fund due to the following reason/s:<br>
        {{remark}} <br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the transfer request <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Registry Team
        `,
  },

  CREDIT_RETIRE_SL_REQUEST_REJECTED: {
    id: "CREDIT_RETIRE_SL_REQUEST_REJECTED",
    subject: "Credit Retirement Request Declined",
    html: `
        Hi {{name}},<br><br>

        Request to retire {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}} made by your organisation has been rejected by {{countryName}} Climate Fund due to the following reason/s:<br>
        {{remark}} <br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the retirement request <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Registry Team
        `,
  },

  CREDIT_TRANSFER_SL_REQUEST_CANCELED: {
    id: "CREDIT_TRANSFER_SL_REQUEST_CANCELED",
    subject: "Credit Transfer Request Cancelled",
    html: `
        Hi {{name}}, <br><br>

        {{organisationName}} has cancelled their request to transfer {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}} due to the following reason/s:<br>
        {{remark}}<br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the transfer request.<br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Registry Team
        `,
  },

  CREDIT_RETIRE_SL_REQUEST_CANCELED: {
    id: "CREDIT_RETIRE_SL_REQUEST_CANCELED",
    subject: "Credit Retirement Request Cancelled",
    html: `
        Hi {{name}}, <br><br>

        {{organisationName}} has cancelled their request to retire {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}} due to the following reason/s:<br>
        {{remark}}<br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the retirement request.<br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Registry Team
        `,
  },

  CARBON_NEUTRAL_SL_REQUESTED: {
    id: "CARBON_NEUTRAL_SL_REQUESTED",
    subject: "Carbon Neutral Certificate Requested",
    html: `
        Hi {{name}},<br><br>

        The Carbon Neutral Certificate for the project {{programmeName}} has been requested by the organisation {{organisationName}}.<br>
        This can be approved/rejected from the organisation details page<br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },

  CARBON_NEUTRAL_SL_REQUEST_APPROVED: {
    id: "CARBON_NEUTRAL_SL_REQUEST_APPROVED",
    subject: "Carbon Neutral Certificate Approved",
    html: `
        Hi {{name}},<br><br>

        The Carbon Neutral Certificate for the project {{programmeName}} requested by your organisation has been approved by {{countryName}} Climate Fund.<br>
        This can be downloaded from your organisation details page<br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },

  CARBON_NEUTRAL_SL_REQUEST_REJECTED: {
    id: "CARBON_NEUTRAL_SL_REQUEST_REJECTED",
    subject: "Carbon Neutral Certificate Declined",
    html: `
        Hi {{name}},<br><br>

        The Carbon Neutral Certificate for the project {{programmeName}} requested by your organisation has been rejected by {{countryName}} Climate Fund due to the following reason/s:<br>
        {{remark}} <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
};
