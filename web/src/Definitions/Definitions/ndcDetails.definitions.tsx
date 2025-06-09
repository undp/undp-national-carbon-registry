/* eslint-disable no-use-before-define */
export type Period = {
  key: string;
  label: string;
  startYear: number;
  endYear: number;
  finalized: boolean;
  deleted: boolean;
};

export type NdcDetail = {
  id: number;
  actionType: NdcDetailsActionType;
  nationalPlanObjective: string;
  kpi: number | string;
  kpiUnit: string;
  ministryName: string;
  periodId?: number;
  status: NdcDetailsActionStatus;
  parentActionId?: number;
};

export type DateRange = {
  startYear: number;
  endYear: number;
};

export enum NdcDetailsActionType {
  MainAction = 'MainAction',
  SubAction = 'SubAction',
}

export enum NdcDetailsActionStatus {
  New = 'New',
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export const getNdcActionStatusEnumVal = (value: string) => {
  const index = Object.keys(NdcDetailsActionStatus).indexOf(value);
  if (index < 0) {
    return value;
  }
  return Object.values(NdcDetailsActionStatus)[index];
};

export const getNdcActionStatusTagType = (status: NdcDetailsActionStatus) => {
  switch (getNdcActionStatusEnumVal(status)) {
    case NdcDetailsActionStatus.Rejected:
      return 'error';
    case NdcDetailsActionStatus.Pending:
      return 'processing';
    case NdcDetailsActionStatus.Approved:
      return 'success';
    default:
      return 'default';
  }
};

export type PopupInfo = {
  title: string;
  icon: any;
  actionBtnText: string;
  okAction: any;
  type: 'primary' | 'danger';
  remarkRequired: boolean;
};
