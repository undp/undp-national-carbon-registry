export const EmailTemplates = {
    REGISTER_EMAIL: {
        subject: 'Carbon Registry: Welcome!',
        html: `
        Welcome {name}, 
        
        Your account has been created for the {countryName} Carbon Credit 
        Registry. Together we can work on reducing global greenhouse gasses. 
        To get the most out of the Registry, take a look: 
        
        Explore the Registry here {login}. 
        
        For future reference, here’s your login information: 
        Homepage: {home} 
        User: {email} 
        Password (temporary): {tempPassword} 
        
        If you have any questions, feel free to email our customer success 
        team <a href="mailto:mailto: help@carbreg.org?subject=I Need Help With The 
        {countryName} Carbon Credit Registry">customer success 
        team</a>
        (We’re lightning quick at 
        replying.) We also offer live chat 
        {liveChat}. 
        
        Sincerely, The {countryName} Carbon Credit Registry Team 
        
        P.S.Need immediate help getting started? Check out our help 
        documentation {helpDoc}. Or, just reply to this email, the 
        {countryName} Carbon Credit Registry Team is always ready to 
        help! 
        
        United Nations Development Programme 
        1 United Nations Plaza 
        New York, NY USA 10001
        `,
        text: ''
    },
    API_KEY_EMAIL: {
        subject: 'Carbon Credit Registry API Key Generation',
        html: `
        Hi {{name}},<br><br>

        You carbon registry account api key regenerated  - {{apiKey}}.
        <br><br>
        Sincerely,<br>
        The Carbon Credit Registry Team 
    `,
        text: ''
    },
    TRANSFER_REQUEST: {
        subject: 'Transfer Request Received',
        html: `
        Hi {{name}},<br><br>

        {{requestedCompany}} has requested to transfer {{credits}} credits with the serial number {{serialNo}} from {{programmeName}}.

        <br><br>
        Sincerely,<br>
        The Carbon Credit Registry Team 
        `,
        text: ''
    },
    RETIRE_REQUEST: {
        subject: 'Retire Request Received',
        html: `
        Hi {{name}},<br><br>

        {{requestedCompany}} has requested to retire {{credits}} credits with the serial number {{serialNo}} from {{programmeName}}.

        <br><br>
        Sincerely,<br>
        The Carbon Credit Registry Team 
        `,
        text: ''
    },
    CHANGE_PASSOWRD: {
        subject: 'Carbon Registry: Your password was changed',
        html: `
        Hi {name},<br><br>
        The password of your Carbon Registry account was changed successfully. <br><br>
        If you do not use {countryName} Carbon Credit Registry or did not request a password reset, please ignore this email or 
        <a href="mailto: help@carbreg.org?subject=Password Problem With The {countryName} Carbon Credit Registry">contact support</a>
        if you have questions. 
        
        <br><br>
        Sincerely, <br>
        The {countryName} Carbon Credit Registry Team
        `,
        text: ''
    },
    PROGRAMME_CREATE: {
        subject: 'New Programme Received for Authorisation',
        html:`
        Hi {name},  <br><br>

        A new programme from {organisationName} is awaiting authorisation. <br>
        
        <a href="{programmePageLink}">Click here</a> to access all the programmes that require authorisation. 
        <br><br>
         
        Sincerely,  <br>
        The {countryName} Carbon Credit Registry Team 
        `
    },
    PROGRAMME_AUTHORISATION: {
        subject: 'Programme authorised',
        html:`
        Hi {name},  <br><br>

        {programmeName} of your organisation has been authorised on {authorisedDate} with the serial number {serialNumber}. 
        <br>
         
        <a href="{programmePageLink}">Click here</a> for more details of the programme. 
        <br><br>
        
        Sincerely,  <br>
        The {countryName} Carbon Credit Registry Team 
        `
    },
    
};
