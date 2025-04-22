import { Injectable } from "@nestjs/common";
import { FileHandlerInterface } from "../../file-handler/filehandler.interface";
import { CreditType } from "../../enum/creditType.enum";
import { ConfigService } from "@nestjs/config";
const PDFDocument = require("pdfkit");
const fs = require("fs");

export interface ProjectRegistrationCertificateData {
  projectName: string;
  companyName: string;
  creditType: string;
  certificateNo: string;
  regDate: string;
  issueDate: string;
  sector: string;
  estimatedCredits: string;
}

@Injectable()
export class ProjectRegistrationCertificateGenerator {
  constructor(
    private fileHandler: FileHandlerInterface,
    private configService: ConfigService
  ) {}

  async generateProjectRegistrationCertificate(
    data: ProjectRegistrationCertificateData,
    programmeId: string,
    isPreview?: boolean
  ) {
    const doc = new PDFDocument({
      margin: 50,
    });

    const filepath = `PROJECT_REGISTRATION_CERTIFICATE_${programmeId}.pdf`;
    const country = this.configService.get("systemCountryName");

    // Define the output file path
    const stream = fs.createWriteStream("/tmp/" + filepath);
    doc.pipe(stream);

    const track =
      data.creditType === CreditType.TRACK_1 ? "Track I" : "Track II";

    // Add logo
    const image1Width = 45;
    // const image2Width = 60;
    const image2Width = 130;

    const imageHeight = 60;
    const image2Height = 65;

    const spaceBetweenImages = 15;

    const totalImageWidth = image1Width + image2Width + 2 * spaceBetweenImages;

    // Start position for the first image (centering all images on the page)
    const startImageX = (doc.page.width - totalImageWidth) / 2;
    const startImageY = 50; // vertical position where images will be placed

    doc.registerFont("Inter", "fonts/Inter-Regular.ttf");
    doc.registerFont("Inter-Bold", "fonts/Inter-Bold.ttf");

    // Draw each image
    doc.image("images/sri-lanka-emblem.png", startImageX, startImageY, {
      width: image1Width,
      height: imageHeight,
    });
    doc.image(
      "images/SLCCS_logo.png",
      startImageX + image1Width + spaceBetweenImages,
      startImageY,
      {
        width: image2Width,
        height: image2Height,
      }
    );
    doc.moveDown(2);

    // Title
    doc
      .fontSize(30)
      .font("Inter-Bold")
      .fillColor("#1f4e79")
      .text("Project Registration Certificate", { align: "center" });

    if (isPreview) {
      this.addPreviewWatermark(doc);
    }

    doc.moveDown(2).fontSize(16).fillColor("black");

    doc
      .font("Inter-Bold")
      .fontSize(16)
      .text("CountryX Climate Fund (Pvt) Ltd", 70, 180, { align: "center" });

    doc.moveDown(0.5);

    doc.font("Inter").fontSize(14).text("registers", { align: "center" });

    doc.moveDown(0.5);

    doc
      .font("Inter-Bold")
      .fontSize(16)
      .text(`${data.projectName}`, { align: "center" });

    doc.moveDown(0.5);

    doc.font("Inter").fontSize(14).text("developed by", { align: "center" });

    doc.moveDown(0.5);

    doc
      .font("Inter")
      .fontSize(16)
      .text(`${data.companyName}`, { align: "center" });

    doc.moveDown(0.5);

    doc.font("Inter").fontSize(14).text("under", { align: "center" });

    doc.moveDown(0.5);

    doc
      .font("Inter-Bold")
      .fontSize(16)
      .text(`${track} of ${country} Carbon Crediting Scheme`, {
        align: "center",
      });

    doc.moveDown(0.5);

    doc
      .font("Inter")
      .fontSize(14)
      .text("In accordance with the SLCCS eligibility criteria and", {
        align: "center",
      });

    doc.moveDown(0.4);

    doc
      .font("Inter")
      .fontSize(14)
      .text("approved CDM methodology", { align: "center" });

    doc
      .fontSize(12)
      .font("Inter-Bold")
      .text("Certificate No ", 170, 425, {
        continued: true,
      })
      .text(`: ${data.certificateNo}`, 215, 425, {
        continued: false,
      })
      .moveDown(1)
      .text("Date of registration ", 170, doc.y, {
        continued: true,
      })
      .text(`: ${data.regDate}`, 183.5, doc.y, {
        continued: false,
      })
      .moveDown(1)
      .text("Date of issue ", 170, doc.y, {
        continued: true,
      })
      .text(`: ${data.issueDate}`, 220, doc.y, {
        continued: false,
      })
      .moveDown(1)
      .text("Sector ", 170, doc.y, {
        continued: true,
      })
      .text(`: ${data.sector}`, 257.5, doc.y, {
        continued: false,
      })
      .moveDown(1)
      .text("Methodology ", 170, doc.y, {
        continued: true,
      })
      .text(`: AMS I.D Version 18.0`, 218.5, doc.y, {
        continued: false,
      })
      .moveDown(1);

    doc
      .font("Inter-Bold")
      .fontSize(16)
      .text(
        `Estimated Annual Emission Reductions: ${data.estimatedCredits} (tCO₂eq)`,
        100,
        doc.y
      );

    // Chairman Signature

    const chairmanSignatureImagePath = "public/signatures/chairman.jpg";

    if (fs.existsSync(chairmanSignatureImagePath)) {
      doc.image(chairmanSignatureImagePath, 110, 579, {
        width: 120,
        height: 100,
      });
    } else {
      console.log(
        "Chairmans Signature does not exist in:",
        chairmanSignatureImagePath
      );
    }

    doc
      .font("Inter")
      .fontSize(10)
      .text("...............................", 135, 660, { align: "left" });

    doc.font("Inter").fontSize(10).text("Chairman", 154, 675);

    doc
      .font("Inter")
      .fontSize(10)
      .text("CountryX Climate Fund (Pvt) Ltd.", 100, 690, { align: "left" });

    doc.image("images/SLCF_logo.jpg", 260, 600, {
      width: 110,
      height: 100,
    });

    // CEO Signature

    const ceoSignatureImagePath = "public/signatures/ceo.jpg";

    if (fs.existsSync(ceoSignatureImagePath)) {
      doc.image(ceoSignatureImagePath, 410, 579, {
        width: 120,
        height: 100,
      });
    } else {
      console.log("CEO Signature does not exist in:", ceoSignatureImagePath);
    }

    doc
      .font("Inter")
      .fontSize(10)
      .text("...............................", 415, 660, { align: "left" });

    doc.font("Inter").fontSize(11).text("Chief Executive Officer", 400, 675);

    doc
      .font("Inter")
      .fontSize(10)
      .text("CountryX Climate Fund (Pvt) Ltd.", 378, 690, { align: "left" });

    doc
      .font("Inter")
      .fontSize(9)
      .text(
        "CountryX Climate Fund (Pvt) Ltd, 'Sobadam Piyasa', No. 416/C/1, Robert Gunawardana Mawatha, Battaramulla.",
        70,
        720,
        { align: "center" }
      );

    doc
      .font("Inter")
      .fontSize(9)
      .text("Phone: 011 2053065  E-mail: info@climatefund.lk", 70, 730, {
        align: "center",
      });

    // End and save the document
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

  // Function to add a preview watermark
  addPreviewWatermark(doc) {
    doc.save(); // Save the current state
    doc
      .fontSize(160) // Set a large font size for visibility
      .font("Helvetica-Bold") // Use a standard, bold font
      .opacity(0.1) // Set low opacity for the watermark
      .fillColor("grey") // Grey color for the watermark text
      .rotate(35, { origin: [doc.page.width / 2, doc.page.height / 2] }) // Rotate the text by 45 degrees around the center
      .text("Preview", 0, doc.page.height / 2 - 100, {
        width: doc.page.width,
        align: "center",
      });
    doc.restore(); // Restore the original state for further additions
  }
}
