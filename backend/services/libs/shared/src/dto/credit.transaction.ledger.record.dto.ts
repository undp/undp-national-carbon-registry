import { CreditTransactionStatusEnum } from "../enum/credit.transaction.status.enum";
import { CreditTransactionTypesEnum } from "../enum/credit.transaction.types.enum";

export class CreditTransactionLedgerRecordDto {
  id: string;
  type: CreditTransactionTypesEnum;
  status: CreditTransactionStatusEnum;
  amount: number;
}
