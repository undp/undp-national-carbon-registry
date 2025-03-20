import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HelperService } from "../util/helpers.service";

@Injectable()
export class SerialNumberManagementService {
  constructor(
    private readonly configService: ConfigService,
    private readonly helperService: HelperService
  ) {}

  public getProjectSerialNumber(projectId: number): string {
    if (
      projectId < 1 ||
      projectId > this.configService.get("serialNumber.maxProjectId")
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "serialNumber.projectIdOutOfRange",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    const creditIdentifier = this.configService.get(
      "serialNumber.creditIdentifier"
    );
    const originatingPartyId = this.configService.get("systemCountry");
    const firstTransferringPartyId = this.configService.get(
      "serialNumber.firstTransferringPartyId"
    );
    const sep = this.configService.get("serialNumber.seperator");
    return `${creditIdentifier}${sep}${originatingPartyId}${sep}${firstTransferringPartyId}${sep}${projectId}`;
  }

  public getCreditBlockSerialNumber(
    serialNumberPrefix: string,
    creditAmount: number,
    alreadyIssuedCreditAmount?: number
  ): string {
    const blockStart = alreadyIssuedCreditAmount
      ? alreadyIssuedCreditAmount + 1
      : 1;
    const blockEnd = blockStart + creditAmount - 1;
    const vintage = new Date().getFullYear();
    const sep = this.configService.get("serialNumber.seperator");
    return (
      serialNumberPrefix +
      `${sep}${blockStart}${sep}${blockEnd}${sep}${vintage}`
    );
  }

  public splitCreditBlockSerialNumber(
    serialNumber: string,
    transferingAmount: number
  ) {
    const currentBlockStart = this.getBlockStart(serialNumber);
    const currentBlockEnd = this.getBlockEnd(serialNumber);
    const totalCreditsInBlock = currentBlockEnd - currentBlockStart + 1;
    if (transferingAmount >= totalCreditsInBlock) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "serialNumber.transferAmountExceedsCreditBlockSize",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    const firstBlocStart = currentBlockStart;
    const firstBlockEnd = currentBlockStart + transferingAmount - 1;
    const secondBlockStart = currentBlockStart + transferingAmount;
    const secondBlockEnd = currentBlockEnd;

    const vintage = this.getVintage(serialNumber);
    const projectSerialNumberPrefix =
      this.getProjectSerailNumberPerfix(serialNumber);
    const sep = this.configService.get("serialNumber.seperator");
    return {
      firstSerialNumber:
        projectSerialNumberPrefix +
        `${sep}${firstBlocStart}${sep}${firstBlockEnd}${sep}${vintage}`,
      secondSerialNumber:
        projectSerialNumberPrefix +
        `${sep}${secondBlockStart}${sep}${secondBlockEnd}${sep}${vintage}`,
    };
  }

  private getBlockStart(serailNumber: string): number {
    const sep = this.configService.get("serialNumber.seperator");
    return Number(serailNumber.split(sep)[4]);
  }

  private getBlockEnd(serailNumber: string): number {
    const sep = this.configService.get("serialNumber.seperator");
    return Number(serailNumber.split(sep)[5]);
  }

  private getVintage(serailNumber: string): string {
    const sep = this.configService.get("serialNumber.seperator");
    return serailNumber.split(sep)[6];
  }

  private getProjectSerailNumberPerfix(serialNumber: string): string {
    const sep = this.configService.get("serialNumber.seperator");
    const parts = serialNumber.split(sep);
    return parts.slice(0, 4).join(sep);
  }

  public getCreditBlockId(serialNumber: string): string {
    const sep = this.configService.get("serialNumber.seperator");
    const parts = serialNumber.split(sep);
    return parts.slice(0, 5).join(sep);
  }
}
