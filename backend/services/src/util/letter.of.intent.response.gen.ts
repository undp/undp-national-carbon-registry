import { Injectable } from "@nestjs/common";
import { HelperService } from "./helpers.service";
import { ConfigService } from "@nestjs/config";
import { FileHandlerInterface } from "../file-handler/filehandler.interface";
const PDFDocument = require("pdfkit");
const fs = require("fs");

@Injectable()
export class LetterOfIntentResponseGen {
    constructor(private helperService: HelperService,
        private configService: ConfigService,
        private fileHandler: FileHandlerInterface) {
    }

    async generateLetter(programmeId: string, programmeName: string, sectoralMinistry: string, orgId: number, orgName: string, orgAddress: string, requestMonth: string, requestYear: number) {
        const filepath = `RESPONSE_FOR_LETTER_OF_INTENT_${programmeId}_${orgId}.pdf`;
        const country = this.configService.get("systemCountryName");
        const minister = this.configService.get("docGenerate.ministerName");
        const ministry = this.configService.get('docGenerate.ministryName');
        const contactEmailForQuestions = this.configService.get('docGenerate.contactEmailForQuestions');
        const date = new Date().toDateString();
        const refNo = this.helperService.generateRandomNumber();


        const doc = new PDFDocument();
        const stream = fs.createWriteStream("/tmp/" + filepath);
        doc.pipe(stream);
        doc.fontSize(11);

        doc.text(refNo, {
            align: "left",
            continued: true,
        });

        doc.text(date, {
            align: "right",
        }).moveDown();

        doc.text(orgAddress, {
            align: "left",
        });

        doc.font("fonts/Inter-Bold.ttf").text(`\n\nRE: LETTER OF INTENT ${programmeName}`, {
            underline: true,
        }).moveDown();


        doc.font("fonts/Inter-Regular.ttf");

        const paragraphs = [
            `The Ministry of Environment, Forestry and Tourism takes note of your proposed ${programmeName} contained in your letter dated ${requestMonth}, ${requestYear} on the above subject matter. The project intends to reduce emissions.`,

            `By this letter, the Ministry of Environment, Forestry and Tourism can confirm that the proposed project aligns with ${country}'s Nationally Determined Contributions (NDC) and Sustainable Development Goals priorities.`,

            `Therefore, the Ministry of Environment, Forestry and Tourism stands ready for future collaboration with ${orgName} in the project development phase to generate mitigation outcomes towards Article 6.2 or Voluntary Carbon Markets.`,

            `Note that the Ministry of Environment, Forestry and Tourism has the mandate, as the designated national body, to oversee the technical arrangements of the carbon market instruments under Article 6.2 of the Paris Agreement.`,

            `Furthermore, kindly note that in developing the ${programmeName} for the carbon market, you will be requested to show evidence of your engagements with the ${sectoralMinistry} to meet regulatory requirements for the project.`,

            `Contact us through ${contactEmailForQuestions} for any clarifications.`,
        ];

        paragraphs.forEach((paragraph) => {
            doc
                .list([paragraph], {
                    bulletRadius: 2, // Radius of the bullet points
                    bulletIndent: 20, // Indentation of the bullet points
                    textIndent: 15, // Indentation of the text after the bullet points
                    listType: "bullet",
                })
                .moveDown(); 
        });

        doc.text(`\n\nThank you.`, {
            align: "left",
        });

        doc.text(`\n\nYours Faithfully,`, {
            align: "left",
        });

        doc.text(`${minister}`, {
            align: "left",
        });

        doc.end();

        const content = await new Promise<string>((resolve) => {
            stream.on("finish", function () {
                const contents = fs.readFileSync("/tmp/" + filepath, {
                    encoding: "base64",
                });
                resolve(contents);
            });
        });
        const url = await this.fileHandler.uploadFile(
            "documents/" + filepath,
            content
        );

        return url;
    }
}