import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FileHandlerInterface } from "../file-handler/filehandler.interface";
const PDFDocument = require("pdfkit");
const fs = require("fs");

@Injectable()
export class LetterSustainableDevSupportLetterGen {
    constructor(
        private configService: ConfigService,
        private fileHandler: FileHandlerInterface) {
    }

    async generateLetter(programmeId: string, programmeName: string, programmeOwners: [], sectoralScope: string, sector: string) {
        const filepath = `LETTER_OF_SUSTAINABLE_DEV_SUPPORT${programmeId}.pdf`;
        const country = this.configService.get("systemCountryName");
        const date = new Date().toDateString();
        const environmentalManagementActHyperlink = this.configService.get("environmentalManagementActHyperlink");

        const doc = new PDFDocument();
        const stream = fs.createWriteStream("/tmp/" + filepath);
        doc.pipe(stream);
        doc.fontSize(11);

        let ownerNamesList = programmeOwners.map((owner: any) => owner.name);
        let programmeOwner;
        if (ownerNamesList.length > 2) {
            programmeOwner = ownerNamesList.slice(0, ownerNamesList.length - 1).join(', ');
            programmeOwner += ' and ' + ownerNamesList[ownerNamesList.length - 1]
        } else {
            programmeOwner = ownerNamesList.join(' and ')
        }

        programmeOwners.map((owner: any) => {
            doc.text(`${owner.name},`, {
                align: "left",
            });

            doc.text(owner.address, {
                align: "left",
            });

            doc.moveDown(1);
        })

        doc.text(date, {
            align: "left",
        });

        doc.text(`\n\nDear Sir or Madam,`, {
            align: "left",
        });

        doc.font("fonts/Inter-Bold.ttf").text(`\n\nRe: Sustainable Development Support Letter For ${programmeName}`);


        doc.font("fonts/Inter-Regular.ttf");

        doc.text(`\n\n${country} became a Party to the Paris Agreement in April 2016 and maintained its updated NDC published in 2022 in the NDC registry. The Carbon Market Secretariat has granted authorisation to ${programmeOwner} as the ${sectoralScope} Developer and is eligible to request for Sustainable Development support letter for ${programmeName} ${country} will host. The ${programmeName} aligns with eligible list of ${country}'s NDC mitigation programmes. After reviewing your request for a sustainable development support letter for ${programmeName} to be host in ${country}, the Carbon Market Secretariat affirms the following: `, {
            
            align: "left",
        });

        doc.text(`\n\nThe mechanism activity developer has compiled with sustainable development requirements in ${country} as follows:`, {
            align: "left",
        });

        doc.text(
            `\n\n a. Demonstrated that it has obtained or otherwise an Environmental Permit under the`,
            {
                indent: 15,
                continued: true,
            }
        );

        doc.text("Environmental Management Act, 2007 & Environmental Impact Assessment (EIA) Regulations 2012", {
            link: environmentalManagementActHyperlink,
            continued: true,
        });

        doc.text(
            ` to safeguard any negative social or environmental-related impacts caused by the activity, including on air and water quality, biodiversity, and worksite safety.`,
            {
                indent: 15,
            }
        );


        doc.text(
            `\n\n b. Committed to using appropriate Sustainable Development Tools to identify and monitor sustainable development impacts delivered by the mitigation activity during validation and verification.`,
            {
                indent: 15,
            }
        );

        doc.text(
            `\n\n c. Committedly consult with local affected stakeholders regarding sustainable development as part of obtaining an Environmental Permit or the validation of the mitigation activity design document.`,
            {
                indent: 15,
            }
        );

        doc.text(`\n\nThe mechanism activity contributes to achieving ${country}'s sustainable development priorities in the ${sector} sector or the objective of NDC or long-term low emission development plan. By this sustainable development support letter, ${country}'s Carbon Market Secretariat has reserved NO objection for the authorised entity to proceed to the next stage of the development of the mitigation activity under the mechanism.`, {
            align: "left",
        });

        doc.text(
            `\n\nSigned,`,
            {
                align: "left",
            }
        );

        doc.moveDown(3);

        doc.text(
            `Carbon Market Secretariat`,
            {
                align: "left",
            }
        );

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