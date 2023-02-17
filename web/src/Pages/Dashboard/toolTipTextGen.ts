import { CompanyRole } from '../../Casl/enums/company.role.enum';

export const toolTipTextGen = (companyRole: any, cardType: any, mine?: boolean) => {
  let text: any = '';
  if (companyRole === CompanyRole.GOVERNMENT) {
    if (cardType === 'Programmes Pending') {
      text = 'Pending state programmes awaiting authorisation';
    } else if (cardType === 'Transfer Requests Sent') {
      text =
        'Pending credit transfer requests sent to programme owners initiated by your organisation';
    } else if (cardType === 'Credit Balance') {
      text = 'Total credit balance owned by your organisation';
    } else if (cardType === 'Programmes') {
      text =
        'Number of programmes created during the specified period and their programme state in the carbon registry at present';
    } else if (cardType === 'Credits') {
      text =
        'Number of credits of programmes created during the specified period and their credit state in the carbon registry at present';
    } else if (cardType === 'Certified credits') {
      text =
        'Number of credits of programmes created during the specified period, uncertified, certified and revoked in the carbon registry at present';
    } else if (cardType === 'Total Programmes') {
      text =
        'Graphical representation of the number of programmes created during the specified period in each programme state in the carbon registry at present';
    } else if (cardType === 'Total Programmes:Sector') {
      text =
        'Graphical representation of the number of programmes in each programme sector created during the specified time in the carbon registry';
    } else if (cardType === 'Total Credits') {
      text =
        'Graphical representation of the number of credits of programmes created during the specified period in each credit state in the carbon registry at present';
    } else if (cardType === 'Total Credits Certified') {
      text =
        'Graphical representation of the number of credits of programmes created during the specified period certified, uncertified and revoked in the carbon registry at present';
    } else if (cardType === 'Programme Locations') {
      text =
        'Locations of the programmes created during the specified period and their programme states in the carbon registry at present';
    } else if (cardType === 'Transfer Locations International') {
      text =
        'Locations of credits of international transfer requests recognised during the specified period';
    }
  } else if (companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
    if (cardType === 'Transfer Requests Received') {
      text = ' Pending credit transfer requests received by your organisation';
    } else if (cardType === 'Transfer Requests Sent') {
      text = 'Pending local credit transfer requests initiated by your organisation';
    } else if (cardType === 'Credit Balance') {
      text = 'Total credit balance owned by your organisation';
    } else if (cardType === 'Programmes') {
      text =
        'Number of programmes created during the specified period and their programme state in the carbon registry at present, owned by your organisation';
    } else if (cardType === 'Credits') {
      text =
        'Number of credits of programmes created during the specified period and their credit state in the carbon registry at present, owned by your organisation';
    } else if (cardType === 'Certified credits') {
      text =
        'Number of credits of programmes created during the specified period, uncertified, certified and revoked in the carbon registry at present, owned by your organisation';
    } else if (cardType === 'Total Programmes') {
      text =
        'Graphical representation of the number of programmes created during the specified period, owned by your organisation, in each programme state in the carbon registry at present';
    } else if (cardType === 'Total Programmes:Sector') {
      text =
        'Graphical representation of the number of programmes owned by your organisation, in each programme sector created during the specified time in the carbon registry';
    } else if (cardType === 'Total Credits') {
      text =
        'Graphical representation of the number of credits of programmes created during the specified period, owned by your organisation, in each credit state in the carbon registry at present';
    } else if (cardType === 'Total Credits Certified') {
      text =
        'Graphical representation of the number of credits of programmes created during the specified period, owned by your organisation, certified, uncertified and revoked in the carbon registry at present';
    } else if (cardType === 'Programme Locations') {
      text =
        'Locations of the programmes created during the specified period, owned by your organisation, and their programme states in the carbon registry at present';
    } else if (cardType === 'Transfer Locations International') {
      text =
        'Locations of credits international transfer requests of programmes owned by your organisation recognised during the specified period';
    }
  } else if (companyRole === CompanyRole.CERTIFIER && mine === true) {
    if (cardType === 'Programmes Uncertified') {
      text =
        'Number of programmes not yet certified including certificates revoked by your organisation';
    } else if (cardType === 'Programmes Certified') {
      text = 'Number of programmes certified by your organisation';
    } else if (cardType === 'Credits Certified') {
      text = 'Number of credits certified by your organisation';
    } else if (cardType === 'Programmes') {
      text =
        'Number of programmes created during the specified period, certified by your organisation, and their programme state in the carbon registry at present';
    } else if (cardType === 'Credits') {
      text =
        'Number of credits of programmes created during the specified period, certified by your organisation and their credit state in the carbon registry at present';
    } else if (cardType === 'Certified credits') {
      text =
        'Number of credits of programmes created during the specified period, certified by your organisation, uncertified, certified and revoked in the carbon registry at present';
    } else if (cardType === 'Total Programmes') {
      text =
        'Graphical representation of the number of programmes in each programme sector created during the specified time, certified by your company, in the carbon registry';
    } else if (cardType === 'Total Programmes:Sector') {
      text =
        'Graphical representation of the number of programmes in each programme sector created during the specified time, certified by your company, in the carbon registry';
    } else if (cardType === 'Total Credits') {
      text =
        'Graphical representation of the number of credits of programmes created during the specified period in each credit state in the carbon registry at present';
    } else if (cardType === 'Total Credits Certified') {
      text =
        'Graphical representation of the number of credits of programmes certified, uncertified and revoked (refer above for states), by your organisation, spread over the specified time';
    } else if (cardType === 'Programme Locations') {
      text =
        'Locations of the programmes created during the specified period, certified by your organisation, and their programme states in the carbon registry at present';
    } else if (cardType === 'Transfer Locations International') {
      text =
        'Locations of credits of international transfer requests of programmes certified by your organisation recognised during the specified period';
    }
  } else if (companyRole === CompanyRole.CERTIFIER && !mine) {
    if (cardType === 'Programmes Uncertified') {
      text =
        'Number of programmes not yet certified including certificates revoked by your organisation';
    } else if (cardType === 'Programmes Certified') {
      text = 'Number of programmes certified by your organisation';
    } else if (cardType === 'Credits Certified') {
      text = 'Number of credits certified by your organisation';
    } else if (cardType === 'Programmes') {
      text =
        'Number of programmes created during the specified period and their programme state in the carbon registry at present';
    } else if (cardType === 'Credits') {
      text =
        'Number of credits of programmes created during the specified period and their credit state in the carbon registry at present';
    } else if (cardType === 'Certified credits') {
      text =
        'Number of credits of programmes created during the specified period, uncertified, certified and revoked in the carbon registry at present';
    } else if (cardType === 'Total Programmes') {
      text =
        'Graphical representation of the number of programmes created during the specified period in each programme state in the carbon registry at present';
    } else if (cardType === 'Total Programmes:Sector') {
      text =
        'Graphical representation of the number of programmes in each programme sector created during the specified time in the carbon registry';
    } else if (cardType === 'Total Credits') {
      text =
        'Graphical representation of the number of credits of programmes created during the specified period in each credit state in the carbon registry at present';
    } else if (cardType === 'Total Credits Certified') {
      text =
        'Graphical representation of the number of credits of programmes created during the specified period certified, uncertified and revoked in the carbon registry at present';
    } else if (cardType === 'Programme Locations') {
      text =
        'Locations of the programmes created during the specified period and their programme states in the carbon registry at present';
    } else if (cardType === 'Transfer Locations International') {
      text =
        'Locations of credits of international transfer requests recognised during the specified period';
    }
  }
  return text;
};
