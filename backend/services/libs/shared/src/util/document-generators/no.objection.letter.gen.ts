import { FileHandlerInterface } from "@app/shared/file-handler/filehandler.interface";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
const PDFDocument = require("pdfkit");
const fs = require("fs");
@Injectable()
export class NoObjectionLetterGenerateService {
  constructor(
    private configService: ConfigService,
    private fileHandler: FileHandlerInterface
  ) {}

  async generateReport(
    orgName: string,
    projectName: string,
    projectId: string
  ) {
    const ministerWithDesignation = this.configService.get(
      "docGenerate.ministerNameAndDesignation"
    );
    const ministry = this.configService.get("docGenerate.ministryName");
    const country = this.configService.get("systemCountryName");
    const capital = this.configService.get("docGenerate.countryCapital");

    const fileName = `NO_OBJECTION_LETTER_${projectId}.pdf`;

    const date = new Date().toDateString();

    // Create a document
    const doc = new PDFDocument();
    const tmpDir = "./";
    const filepath = `${tmpDir}/${fileName}`;
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);
    doc.fontSize(8).text(capital + ", " + date, {
      align: "right",
    });

    doc.fontSize(9);
    doc
      .font("fonts/Inter-Bold.ttf")
      .text(`\n\nRe: Initial Notification Form by ${orgName} `);

    doc.text("\n\nNo Objection Letter", {
      align: "center",
    });

    doc.fontSize(9).font("fonts/Inter-Regular.ttf");

    doc.text(
      `\nTo Whom It May Concern,\n\nWe refer to the programme titled ${projectName} in ${country} as included in the funding proposal submitted by ${orgName} to us on ${date}.\n\nThe undersigned is the duly authorized representative of the ${ministry} of Government of ${country}.\n\nPursuant to the regulations for Article 6.2 of the Paris Agreement in ${country}, the content of which we acknowledge to have reviewed, we hereby confirm no conflict with these regulations and communicate our no-objection to the programme as included in the funding proposal.`
    );

    doc.text(`\n\nBy communicating our no-objection, it is implied that:\n\n`);

    doc.text(
      `(a) The government of ${country} has no-objection to the programme as included in the carbon credit proposal;\n\n(b) The programme as described in the proposal is in conformity with the national priorities, strategies and plans for internationally transferable mitigation outcomes of ${country};\n\n(c) In accordance with the ${country}'s environmental and social safeguards, the programme as included in the funding proposal is in conformity with relevant national laws and regulations.\n\n(d) This letter does not prejudicate later authorization for transfer.`
    );

    doc.text(
      `\n\nWe confirm that our national process for ascertaining no-objection to the programme as included in the proposal has been duly followed.\n\nWe confirm that our no-objection applies to all projects or activities to be implemented within the scope of the programme.\n\nWe acknowledge that this letter will be made publicly available on the Carbon Transparency website, registered under ${projectId}.`
    );

    doc.text(
      `\n\nSincerely,\n${ministerWithDesignation}\nGovernment of ${country}`
    );
    // Finalize PDF file
    doc.end();
    const content = await new Promise<string>((resolve) => {
      stream.on("finish", () => {
        const contents = fs.readFileSync(filepath, {
          encoding: "base64",
        });
        resolve(contents);
      });
    });

    const url = await this.fileHandler.uploadFile(
      "documents/" + fileName,
      content
    );
    return url;
  }
}
