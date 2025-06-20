import { TxType } from "../enum/txtype.enum";

export class UpdateProjectProposalStageDto {
  programmeId: string;
  txType: TxType;
  data?: any;
}
