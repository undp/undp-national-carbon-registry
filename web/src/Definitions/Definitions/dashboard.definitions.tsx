import { CompanyRole } from '../Enums/company.role.enum';
import { StatsCardsTypes } from '../Enums/statsCards.type.enum';

export const toolTipTextGen = (companyRole: any, cardType: any, mine?: boolean) => {
  let text: any = '';
  if (companyRole === CompanyRole.GOVERNMENT) {
    if (cardType === StatsCardsTypes.PROGRAMMES_PENDING) {
      text = 'Pending state projects awaiting authorisation';
    } else if (cardType === StatsCardsTypes.TRANSFER_REQUEST_SENT) {
      text =
        'Pending credit transfer requests sent to project owners initiated by your organisation';
    } else if (cardType === StatsCardsTypes.CREDIT_BALANCE) {
      text = 'Total credit balance owned by your organisation';
    } else if (cardType === StatsCardsTypes.PROGRAMMES) {
      text =
        'Number of projects created during the specified period and their project state in the carbon registry at present';
    } else if (cardType === StatsCardsTypes.CREDITS) {
      text =
        'Number of credits of projects created during the specified period and their credit state in the carbon registry at present';
    } else if (cardType === StatsCardsTypes.CERTIFIED_CREDITS) {
      text =
        'Number of credits of projects created during the specified period, uncertified, certified and revoked in the carbon registry at present';
    } else if (cardType === StatsCardsTypes.TOTAL_PROGRAMMES) {
      text =
        'Graphical representation of the number of projects created during the specified period in each project state in the carbon registry at present';
    } else if (cardType === StatsCardsTypes.TOTAL_PROGRAMMES_SECTOR) {
      text =
        'Graphical representation of the number of projects in each project sector created during the specified time in the carbon registry';
    } else if (cardType === StatsCardsTypes.TOTAL_CREDITS) {
      text =
        'Graphical representation of the number of credits of projects created during the specified period in each credit state in the carbon registry at present';
    } else if (cardType === StatsCardsTypes.TOTAL_CREDITS_CERTIFIED) {
      text =
        'Graphical representation of the number of credits of projects created during the specified period certified, uncertified and revoked in the carbon registry at present';
    } else if (cardType === StatsCardsTypes.PROGRAMME_LOCATIONS) {
      text =
        'Locations of the projects created during the specified period and their project states in the carbon registry at present';
    } else if (cardType === StatsCardsTypes.TRANSFER_LOCATIONS_INTERNATIONAL) {
      text =
        'Locations of credits of international transfer requests recognised during the specified period';
    }
  } else if (companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
    if (cardType === StatsCardsTypes.TRANSFER_REQUEST_RECEIVED) {
      text = 'Pending credit transfer requests received by your organisation';
    } else if (cardType === StatsCardsTypes.TRANSFER_REQUEST_SENT) {
      text = 'Pending local credit transfer requests initiated by your organisation';
    } else if (cardType === StatsCardsTypes.CREDIT_BALANCE) {
      text = 'Total credit balance owned by your organisation';
    } else if (cardType === StatsCardsTypes.PROGRAMMES) {
      text =
        'Number of projects created during the specified period and their project state in the carbon registry at present, owned by your organisation';
    } else if (cardType === StatsCardsTypes.CREDITS) {
      text =
        'Number of credits of projects created during the specified period and their credit state in the carbon registry at present, owned by your organisation';
    } else if (cardType === StatsCardsTypes.CERTIFIED_CREDITS) {
      text =
        'Number of credits of projects created during the specified period, uncertified, certified and revoked in the carbon registry at present, owned by your organisation';
    } else if (cardType === StatsCardsTypes.TOTAL_PROGRAMMES) {
      text =
        'Graphical representation of the number of projects created during the specified period, owned by your organisation, in each project state in the carbon registry at present';
    } else if (cardType === StatsCardsTypes.TOTAL_PROGRAMMES_SECTOR) {
      text =
        'Graphical representation of the number of projects owned by your organisation, in each project sector created during the specified time in the carbon registry';
    } else if (cardType === StatsCardsTypes.TOTAL_CREDITS) {
      text =
        'Graphical representation of the number of credits of projects created during the specified period, owned by your organisation, in each credit state in the carbon registry at present';
    } else if (cardType === StatsCardsTypes.TOTAL_CREDITS_CERTIFIED) {
      text =
        'Graphical representation of the number of credits of projects created during the specified period, owned by your organisation, certified, uncertified and revoked in the carbon registry at present';
    } else if (cardType === StatsCardsTypes.PROGRAMME_LOCATIONS) {
      text =
        'Locations of the projects created during the specified period, owned by your organisation, and their project states in the carbon registry at present';
    } else if (cardType === StatsCardsTypes.TRANSFER_LOCATIONS_INTERNATIONAL) {
      text =
        'Locations of credits international transfer requests of projects owned by your organisation recognised during the specified period';
    }
  } else if (companyRole === CompanyRole.CERTIFIER && mine === true) {
    if (cardType === StatsCardsTypes.PROGRAMMES_UNCERTIFIED) {
      text =
        'Number of projects not yet certified including certificates revoked by your organisation';
    } else if (cardType === StatsCardsTypes.PROGRAMMES_CERTIFIED) {
      text = 'Number of projects certified by your organisation';
    } else if (cardType === StatsCardsTypes.CREDIT_CERTIFIED) {
      text = 'Number of credits certified by your organisation';
    } else if (cardType === StatsCardsTypes.PROGRAMMES) {
      text =
        'Number of projects created during the specified period, certified by your organisation, and their project state in the carbon registry at present';
    } else if (cardType === StatsCardsTypes.CREDITS) {
      text =
        'Number of credits of projects created during the specified period, certified by your organisation and their credit state in the carbon registry at present';
    } else if (cardType === StatsCardsTypes.CERTIFIED_CREDITS) {
      text =
        'Number of credits of projects created during the specified period, certified by your organisation, uncertified, certified and revoked in the carbon registry at present';
    } else if (cardType === StatsCardsTypes.TOTAL_PROGRAMMES) {
      text =
        'Graphical representation of the number of projects in each project sector created during the specified time, certified by your company, in the carbon registry';
    } else if (cardType === StatsCardsTypes.TOTAL_PROGRAMMES_SECTOR) {
      text =
        'Graphical representation of the number of projects in each project sector created during the specified time, certified by your company, in the carbon registry';
    } else if (cardType === StatsCardsTypes.TOTAL_CREDITS) {
      text =
        'Graphical representation of the number of credits of projects created during the specified period in each credit state in the carbon registry at present';
    } else if (cardType === StatsCardsTypes.TOTAL_CREDITS_CERTIFIED) {
      text =
        'Graphical representation of the number of credits of projects certified, uncertified and revoked (refer above for states), by your organisation, spread over the specified time';
    } else if (cardType === StatsCardsTypes.PROGRAMME_LOCATIONS) {
      text =
        'Locations of the projects created during the specified period, certified by your organisation, and their project states in the carbon registry at present';
    } else if (cardType === StatsCardsTypes.TRANSFER_LOCATIONS_INTERNATIONAL) {
      text =
        'Locations of credits of international transfer requests of projects certified by your organisation recognised during the specified period';
    }
  } else if (companyRole === CompanyRole.CERTIFIER && !mine) {
    if (cardType === StatsCardsTypes.PROGRAMMES_UNCERTIFIED) {
      text =
        'Number of projects not yet certified including certificates revoked by your organisation';
    } else if (cardType === StatsCardsTypes.PROGRAMMES_CERTIFIED) {
      text = 'Number of projects certified by your organisation';
    } else if (cardType === StatsCardsTypes.CREDIT_CERTIFIED) {
      text = 'Number of credits certified by your organisation';
    } else if (cardType === StatsCardsTypes.PROGRAMMES) {
      text =
        'Number of projects created during the specified period and their project state in the carbon registry at present';
    } else if (cardType === StatsCardsTypes.CREDITS) {
      text =
        'Number of credits of projects created during the specified period and their credit state in the carbon registry at present';
    } else if (cardType === StatsCardsTypes.CERTIFIED_CREDITS) {
      text =
        'Number of credits of projects created during the specified period, uncertified, certified and revoked in the carbon registry at present';
    } else if (cardType === StatsCardsTypes.TOTAL_PROGRAMMES) {
      text =
        'Graphical representation of the number of projects created during the specified period in each project state in the carbon registry at present';
    } else if (cardType === StatsCardsTypes.TOTAL_PROGRAMMES_SECTOR) {
      text =
        'Graphical representation of the number of projects in each project sector created during the specified time in the carbon registry';
    } else if (cardType === StatsCardsTypes.TOTAL_CREDITS) {
      text =
        'Graphical representation of the number of credits of projects created during the specified period in each credit state in the carbon registry at present';
    } else if (cardType === StatsCardsTypes.TOTAL_CREDITS_CERTIFIED) {
      text =
        'Graphical representation of the number of credits of projects created during the specified period certified, uncertified and revoked in the carbon registry at present';
    } else if (cardType === StatsCardsTypes.PROGRAMME_LOCATIONS) {
      text =
        'Locations of the projects created during the specified period and their project states in the carbon registry at present';
    } else if (cardType === StatsCardsTypes.TRANSFER_LOCATIONS_INTERNATIONAL) {
      text =
        'Locations of credits of international transfer requests recognised during the specified period';
    }
  }
  return text;
};
