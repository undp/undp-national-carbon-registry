import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { HelperService } from "./helpers.service";

@Injectable()
export class SLCFSerialNumberGeneratorService {
  constructor(private helperService: HelperService) {}

  generateProjectRegistrationSerial(programmeId: string) {
    return `SLCCS/REG/${new Date().getFullYear()}/${programmeId}`;
  }

  // MARK:calculateCreditSerialNumber
  // this method calculate the credit serial number using current creditStartSerial and the amount of credits that changed
  calculateCreditSerialNumber(creditStartSerial: string, creditAmount: number) {
    if (!this.matchesCreditFormat(creditStartSerial)) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "creditRetirementSl.creditStartSerialNumberFormatError",
          []
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    // Break the string into parts around the last '/'
    let parts = creditStartSerial.split("/");
    // Get the last part, which is assumed to be a number
    let lastNumber = parseInt(parts.pop(), 10);
    // Increment the number
    lastNumber += creditAmount;
    // Reassemble the string with the new number
    return parts.join("/") + "/" + lastNumber;
  }

  public generateRetirementReferenceNumber(
    programmeId: string,
    previousRefId: string | null
  ): string {
    // Default to '0001' if no previous reference ID is provided
    let lastNumber = "0001";
    if (previousRefId) {
      // Extract the last part of the previous reference ID
      const parts = previousRefId.split("/");
      const lastSection = parts[parts.length - 1];
      // Parse the last section as a number, increment it, and pad it back to 4 digits
      const incrementedNumber = (parseInt(lastSection, 10) + 1).toString().padStart(4, "0");
      lastNumber = incrementedNumber;
    }

    // Convert the numbers to strings and pad them with zeros to ensure they are 4 digits
    const paddedRetirementReqId = lastNumber.padStart(4, "0");
    const paddedProgrammeNumber = programmeId.padStart(4, "0");
    // Construct the full string
    return `SLCCS/${paddedProgrammeNumber}/${paddedRetirementReqId}`;
  }

  public generateCreditIssueCertificateNumber(
    programmeRegistrationSerial: string,
    previousCreditIssueCertSerial: string | null
  ): string {
    // Default to '0001' if no previous reference ID is provided
    let lastNumber = "01";
    if (previousCreditIssueCertSerial) {
      // Extract the last part of the previous reference ID
      const parts = previousCreditIssueCertSerial.split("/");
      const lastSection = parts[parts.length - 1];
      // Parse the last section as a number, increment it, and pad it back to 4 digits
      const incrementedNumber = (parseInt(lastSection, 10) + 1).toString().padStart(2, "0");
      lastNumber = incrementedNumber;
    }

    // Convert the numbers to strings and pad them with zeros to ensure they are 4 digits
    const paddedRetirementReqId = lastNumber.padStart(2, "0");
    // Construct the full string
    return `${programmeRegistrationSerial}/CI/${paddedRetirementReqId}`;
  }

  public generateCarbonNeutralCertificateNumber(
    previousCreditIssueCertSerial: string | null
  ): string {
    // Default to '0001' if no previous reference ID is provided
    let lastNumber = "0001";
    if (previousCreditIssueCertSerial) {
      // Extract the last part of the previous reference ID
      const parts = previousCreditIssueCertSerial.split("/");
      const lastSection = parts[parts.length - 1];
      // Parse the last section as a number, increment it, and pad it back to 4 digits
      const incrementedNumber = (parseInt(lastSection, 10) + 1).toString().padStart(2, "0");
      lastNumber = incrementedNumber;
    }

    // Convert the numbers to strings and pad them with zeros to ensure they are 4 digits
    const paddedRetirementReqId = lastNumber.padStart(4, "0");
    // Construct the full string
    return `CCF/CNC/${paddedRetirementReqId}`;
  }

  public matchesCreditFormat(serialNumber: string) {
    const pattern = /^SLCCS\/REG\/\d{4}\/\d+$/;
    return pattern.test(serialNumber);
  }
}
