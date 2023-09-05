export const EmailTemplates = {
  ORGANISATION_CREATE: {
    id: "ORGANISATION_CREATE",
    subject: "Welcome!",
    html: `
        Welcome {{organisationName}},<br><br>
        Your Organisation has been registered with the {{countryName}} Carbon Registry as a {{organisationRole}} Organisation. <br><br>
        Explore the Registry here {{home}}. <br><br>

        Sincerely,<br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  USER_CREATE: {
    id: "USER_CREATE",
    subject: "Welcome!",
    html: `
        Welcome {{name}}, <br><br>

        Your account has been created for the {{countryName}} Carbon Credit
        Registry. You can access your account using the temporary Homepage: {{home}} <br><br>

        User: {{email}} <br>
        Password (temporary): {{tempPassword}} <br><br>

        If you have any questions, feel free to email our customer success
        team <a href="mailto:help@carbreg.org?subject=I Need Help With The {{countryName}} Carbon Credit Registry">customer success team</a>
        (We’re lightning quick at replying.) We also offer live chat {{liveChat}}.
        <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team <br><br>

        <div style="font-size:12px">
            P.S.Need immediate help getting started? Check out our help
            <a href="{{helpDoc}}">documentation</a>. Or, just reply to this email, the
            {{countryName}} Carbon Credit Registry Team is always ready to help!
        </div>
        <br>
        <div style="font-size:12px">
            {{countryName}} <br>
            {{address}}
        </div>
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
    subject: "New Programme Received for Authorisation",
    html: `
        Hi {{name}}, <br><br>

        A new programme owned by {{organisationName}} is awaiting authorisation. <br><br>

        Click <a href="{{programmePageLink}}">here</a> to access all the programmes that require authorisation.
        <br><br>

        Sincerely,  <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  PROGRAMME_AUTHORISATION: {
    id: "PROGRAMME_AUTHORISATION",
    subject: "Programme Authorised",
    html: `
        Hi {{name}},  <br><br>

        {{programmeName}}  of your Organisation has been authorised on {{authorisedDate}} with the serial number {{serialNumber}}.
        <br><br>

        Click <a href="{{programmePageLink}}">here</a> for more details of the programme.
        <br><br>

        Sincerely,  <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  PROGRAMME_REJECTION: {
    id: "PROGRAMME_REJECTION",
    subject: "Programme Rejected",
    html: `
        Hi {{name}}, <br><br>

        {{programmeName}} of your Organisation has been rejected on {{date}} due to the following reason/s: <br>
        {{reason}} <br><br>

        Click <a href="{{pageLink}}">here</a> for more details of the programme.  <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  CREDIT_ISSUANCE: {
    id: "CREDIT_ISSUANCE",
    subject: "Credits Issued",
    html: `
        Hi {{name}}, <br><br>

        {{programmeName}} of your Organisation with the serial number {{serialNumber}} has been issued with {{credits}} credits.<br><br>

        Click <a href="{{pageLink}}">here</a> for more details of the programme.<br><br>

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
  PROGRAMME_CERTIFICATION: {
    id: "PROGRAMME_CERTIFICATION",
    subject: "Programme Certified by {{organisationName}}",
    html: `
        Hi {{name}},<br><br>

        The {{programmeName}} containing {{credits}} credits with the serial number {{serialNumber}} of your Organisation has been certified by {{organisationName}}. <br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the certification. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  PROGRAMME_CERTIFICATION_REVOKE_BY_CERT: {
    id: "PROGRAMME_CERTIFICATION_REVOKE_BY_CERT",
    subject: "Programme Certificate Revoked by {{organisationName}}",
    html: `
        Hi {{name}},<br><br>

        The certification of the programme {{programmeName}} containing {{credits}} credits with the serial number {{serialNumber}} has been revoked by {{organisationName}}. <br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the certification. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  PROGRAMME_CERTIFICATION_REVOKE_BY_GOVT_TO_PROGRAMME: {
    id: "PROGRAMME_CERTIFICATION_REVOKE_BY_GOVT_TO_PROGRAMME",
    subject: "Programme Certificate Revoked by {{government}}",
    html: `
        Hi {{name}},<br><br>

        The certification given by {{organisationName}} for the programme {{programmeName}} containing {{credits}} credits with the serial number {{serialNumber}} has been revoked by the {{government}}. <br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the certification. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  PROGRAMME_CERTIFICATION_REVOKE_BY_GOVT_TO_CERT: {
    id: "PROGRAMME_CERTIFICATION_REVOKE_BY_GOVT_TO_CERT",
    subject: "Programme Certificate Revoked by {{government}}",
    html: `
        Hi {{name}},<br><br>

        The certification given by your Organisation for the programme {{programmeName}} containing {{credits}} credits with the serial number {{serialNumber}} has been revoked by the {{government}}. <br><br>
        Click <a href="{{pageLink}}">here</a> for more details of the certification. <br><br>

        Sincerely, <br>
        The {{countryName}} Carbon Credit Registry Team
        `,
  },
  PROGRAMME_CERTIFICATION_REVOKE_BY_SYSTEM: {
    id: "PROGRAMME_CERTIFICATION_REVOKE_BY_SYSTEM",
    subject: "Programme Certificate Revoked by the System",
    html: `
        Hi {{name}},<br><br>

        The certification given by {{organisationName}} for the programme {{programmeName}} containing {{credits}} credits with the serial number {{serialNumber}} has been revoked by the system as {{organisationName}} was deactivated. <br><br>
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

        {{credits}} credits of the programme {{programmeName}} with the serial number {{serialNumber}} has been retired by the {{government}} as {{reason}}.<br><br>
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

        {{organisationName}} has requested an international transfer retirement of {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}}. <br><br>
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

        Request to internationally transfer {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}} to {{country}} made by {{organisationName}} has been cancelled.<br><br>
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
      Request to internationally transfer {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}} to {{country}} made by your Organisation has been cancelled by the system due to insufficient credits available. <br><br>
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
      Request to internationally transfer {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}} to {{country}} made by {{organisationName}} has been cancelled by the system due to insufficient credits available. <br><br>
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

        Request to internationally transfer {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}} to {{country}} made by your Organisation has been recognised.<br><br>
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

        Request to internationally transfer {{credits}} credits with the serial number {{serialNumber}} from {{programmeName}} to {{country}} made by your Organisation has not been recognised.<br><br>
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
};
