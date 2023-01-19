interface chartMonthProgrammeStageResult {
  awaitingAuthorization?: number;
  issued?: number;
  rejected?: number;
  retired?: number;
  transferred?: number;
}

interface chartMonthProgrammeStageResultSend {
  awaitingAuthorization?: number[];
  issued?: number[];
  rejected?: number[];
}

interface chartTotalProgramsResultInMonths {
  jan?: chartMonthProgrammeStageResult;
  feb?: chartMonthProgrammeStageResult;
  mar?: chartMonthProgrammeStageResult;
  apr?: chartMonthProgrammeStageResult;
  may?: chartMonthProgrammeStageResult;
  jun?: chartMonthProgrammeStageResult;
  jul?: chartMonthProgrammeStageResult;
  aug?: chartMonthProgrammeStageResult;
  sep?: chartMonthProgrammeStageResult;
  oct?: chartMonthProgrammeStageResult;
  nov?: chartMonthProgrammeStageResult;
  dec?: chartMonthProgrammeStageResult;
}

export interface chartStatsResultInMonths {
  totalPrograms?: chartTotalProgramsResultInMonths;
}

export interface chartStatsResultSend {
  totalPrograms?: chartMonthProgrammeStageResultSend;
}

export let chartStatsResultInitialValueSend: chartStatsResultSend = {
  totalPrograms: {
    awaitingAuthorization: [],
    issued: [],
    rejected: [],
  },
};

export let chartStatsResultInitialValueInMonths: chartStatsResultInMonths = {
  totalPrograms: {
    jan: {
      awaitingAuthorization: 0,
      issued: 0,
      rejected: 0,
    },
    feb: {
      awaitingAuthorization: 0,
      issued: 0,
      rejected: 0,
    },
    mar: {
      awaitingAuthorization: 0,
      issued: 0,
      rejected: 0,
    },
    apr: {
      awaitingAuthorization: 0,
      issued: 0,
      rejected: 0,
    },
    may: {
      awaitingAuthorization: 0,
      issued: 0,
      rejected: 0,
    },
    jun: {
      awaitingAuthorization: 0,
      issued: 0,
      rejected: 0,
    },
    jul: {
      awaitingAuthorization: 0,
      issued: 0,
      rejected: 0,
    },
    aug: {
      awaitingAuthorization: 0,
      issued: 0,
      rejected: 0,
    },
    sep: {
      awaitingAuthorization: 0,
      issued: 0,
      rejected: 0,
    },
    oct: {
      awaitingAuthorization: 0,
      issued: 0,
      rejected: 0,
    },
    nov: {
      awaitingAuthorization: 0,
      issued: 0,
      rejected: 0,
    },
    dec: {
      awaitingAuthorization: 0,
      issued: 0,
      rejected: 0,
    },
  },
};
