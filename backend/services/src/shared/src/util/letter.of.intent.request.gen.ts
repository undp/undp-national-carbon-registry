import { Injectable } from "@nestjs/common";
import { HelperService } from "./helpers.service";
import { ConfigService } from "@nestjs/config";
import { FileHandlerInterface } from "../file-handler/filehandler.interface";
const PDFDocument = require("pdfkit");
const fs = require("fs");

@Injectable()
export class LetterOfIntentRequestGen {
    constructor(private helperService: HelperService,
        private configService: ConfigService,
        private fileHandler: FileHandlerInterface) {
    }

    async generateLetter(programmeId, programmeName, orgName, programmeLocations, designDocUrl) {
        const filepath = `REQUEST_FOR_LETTER_OF_INTENT_${programmeId}.pdf`;
        const country = this.configService.get("systemCountryName");
        const continent = this.configService.get("systemContinentName");
        const date = new Date().toDateString();
        const refNo = this.helperService.generateRandomNumber();

        let programmeLocation;  
        if (programmeLocations.length > 2) {
            programmeLocation = programmeLocations.slice(0, programmeLocations.length - 1).join(", ");
            programmeLocation += " and " + programmeLocations[programmeLocations.length - 1];
        } else {
            programmeLocation = programmeLocations.join(" and ");
        }

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
        });

        doc.text(`\n\nDear Ministry of Environment, Forestry and Tourism,`, {
            align: "left",
        });

        doc.font("fonts/Inter-Bold.ttf").text(`\n\nRequest for Letter of Intent ${programmeName}`);


        doc.font("fonts/Inter-Regular.ttf");

        doc.text(`\n\n${orgName} is active in the business area and experienced in technology in ${continent} and ${country}. ${orgName} intends to develop and implement ${programmeName} at ${programmeLocation} in ${country} to generate mitigation outcomes authorised for international transfer under this framework towards the international mitigation use as determined by the participating Parties.`, {
            align: "left",
        });

        doc.text(`\n\nThe ${programmeName} falls in positive list of ${country} NDC, and associated emissions are included in the national greenhouse gas inventory of ${country}. ${orgName} is, therefore, by this letter, requesting a Letter of Intent for ${programmeName} to confirm its eligibility status, alignment with ${country}'s NDC and SDGs, as well as the safeguard requirement for ${country}.`, {
            align: "left",
        });


        doc.text(`\n\nPlease do not hesitate to request any additional information you may require. We hope to receive feedback on our request at your earliest convenience.`, {
            align: "left",
        });

        doc.text(`\n\nThank you.`, {
            align: "left",
        });

        doc.text(`\n\nYours faithfully,`, {
            align: "left",
        });

        doc.text(`${orgName}`, {
            align: "left",
        });

        doc.fillColor("blue").text("Cc: Design Document", {
            link: designDocUrl,
            underline: true
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