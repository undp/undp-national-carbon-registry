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
    vintage: string,
    alreadyIssuedCreditAmount?: number
  ): string {
    const blockStart = alreadyIssuedCreditAmount
      ? alreadyIssuedCreditAmount + 1
      : 1;
    const blockEnd = blockStart + creditAmount - 1;
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
    const firstBlockEnd = currentBlockEnd - transferingAmount;
    const secondBlockStart = currentBlockEnd - transferingAmount + 1;
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

  /**
   * Public [start, end] range accessor for callers outside this service
   * (e.g. credit-block history/tree reconstruction) that need the same
   * range parsing `splitCreditBlockSerialNumber` uses internally, without
   * duplicating the separator/position logic.
   */
  public getBlockRange(serialNumber: string): { start: number; end: number } {
    return {
      start: this.getBlockStart(serialNumber),
      end: this.getBlockEnd(serialNumber),
    };
  }

  public getVintage(serailNumber: string): string {
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

  public getBlockStartId(serialNumber: string) {
    const projectSerialNumberPrefix =
      this.getProjectSerailNumberPerfix(serialNumber);
    const vintage = this.getVintage(serialNumber);
    const blockStart = this.getBlockStart(serialNumber);
    const sep = this.configService.get("serialNumber.seperator");
    return (
      projectSerialNumberPrefix +
      `${sep}${blockStart}${sep}${blockStart}${sep}${vintage}`
    );
  }

  public getBlockEndId(serialNumber: string) {
    const projectSerialNumberPrefix =
      this.getProjectSerailNumberPerfix(serialNumber);
    const vintage = this.getVintage(serialNumber);
    const blockEnd = this.getBlockEnd(serialNumber);
    const sep = this.configService.get("serialNumber.seperator");
    return (
      projectSerialNumberPrefix +
      `${sep}${blockEnd}${sep}${blockEnd}${sep}${vintage}`
    );
  }

  /**
   * Compose an ITMO serial in the same shape as the regular credit
   * block serial (getCreditBlockSerialNumber) — same separator, same
   * positions for project id / block range / vintage — but with the
   * mock creditIdentifier and firstTransferringPartyId components
   * replaced by real data: the block's ITMO-authorized cooperative
   * approach's real caReferenceNumber, and the config system country
   * in both the originating-party and first-transferring-party slots
   * (the host/origin country IS the first transferring Party for an
   * ITMO under this registry).
   *
   * Format: "{caReferenceNumber}-{country}-{country}-{projectId}-{blockStart}-{blockEnd}-{vintage}"
   *
   * Because this mirrors the regular serial's shape exactly,
   * splitCreditBlockSerialNumber/getBlockRange/getVintage all work on
   * itmoSerial strings unchanged — no separate parsing/split logic is
   * needed to keep it in sync through block splits.
   */
  public getItmoSerial(
    caReferenceNumber: string,
    projectId: string,
    blockStart: number,
    blockEnd: number,
    vintage: string
  ): string {
    const originatingPartyId = this.configService.get("systemCountry");
    const sep = this.configService.get("serialNumber.seperator");
    return `${caReferenceNumber}${sep}${originatingPartyId}${sep}${originatingPartyId}${sep}${projectId}${sep}${blockStart}${sep}${blockEnd}${sep}${vintage}`;
  }

  /**
   * Pulls the project id straight out of an existing (regular or ITMO)
   * serial string, avoiding a project-row fetch when the caller already
   * has the block's serial in hand.
   */
  public getProjectIdFromSerial(serialNumber: string): string {
    const sep = this.configService.get("serialNumber.seperator");
    return serialNumber.split(sep)[3];
  }

  public getAuthorizationId(projectId: string, authTime: number) {
    const date = new Date(authTime);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const year = String(date.getFullYear()).slice(-2);
    const dateFormat = `${day}${month}${year}`;
    return `${dateFormat}${this.configService.get(
      "systemCountryCode"
    )}${projectId}`;
  }
}
