import { Injectable } from "@nestjs/common";
import { FileHandlerInterface } from "../file-handler/filehandler.interface";
import { CreditType } from "src/enum/creditType.enum";
const PDFDocument = require("pdfkit");
const fs = require("fs");

export interface CreditIssueCertificateData {
  projectName: string;
  companyName: string;
  creditType: string;
  certificateNo: string;
  issueDate: string;
  monitoringStartDate: string;
  monitoringEndDate: string;
  issuedCredits: number;
  startCreditSerialNo: string;
  endCreditSerialNo: string;
}

@Injectable()
export class CreditIssueCertificateGenerator {
  constructor(private fileHandler: FileHandlerInterface) {}

  async generateCreditIssueCertificate(data: CreditIssueCertificateData) {
    const doc = new PDFDocument({
      margin: 50,
    });

    const refFileName = data.certificateNo.replace(/\//g, "_");
    const filepath = `CREDIT_ISSUANCE_CERTIFICATE_${refFileName}.pdf`;

    // Define the output file path
    const stream = fs.createWriteStream("/tmp/" + filepath);
    doc.pipe(stream);

    const track = data.creditType === CreditType.TRACK_1 ? "Track I" : "Track II";

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
      .font("Helvetica-Bold")
      .fillColor("#134e9e")
      .text("Credit Issuance Certificate", { align: "center" });

    doc.moveDown(2).fontSize(16).fillColor("black");

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("Sri Lanka Climate Fund (PVT) Ltd", 70, 180, { align: "center" });

    doc.moveDown(0.5);

    doc.font("Helvetica").fontSize(12).text("Issues", { align: "center" });

    doc.moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(12)
      .text("Sri Lankan Certified Emission Reductions (SCER)", { align: "center" });

    doc.moveDown(0.5);

    doc.font("Helvetica").fontSize(12).text("for", { align: "center" });

    doc.moveDown(0.5);

    doc.font("Helvetica-Bold").fontSize(14).text(`${data.projectName}`, { align: "center" });

    doc.moveDown(0.5);

    doc.font("Helvetica").fontSize(12).text("of", { align: "center" });

    doc.moveDown(0.5);

    doc.font("Helvetica").fontSize(14).text(`${data.companyName}`, { align: "center" });

    doc.moveDown(0.5);

    doc.font("Helvetica").fontSize(12).text("registered under", { align: "center" });

    doc.moveDown(0.5);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(`${track} of Sri Lanka Carbon Credit Scheme`, { align: "center" });

    doc.moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(12)
      .text("In accordance with the SLCCR eligibility criteria and", { align: "center" });

    doc.moveDown(0.4);

    doc
      .font("Helvetica")
      .fontSize(12)
      .text("Approved CDM methodology (AMS I.D Version 18.0)", { align: "center" });

    doc.moveDown(1);

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Certificate No ", 180, 440, {
        continued: true,
      })
      .text(`: ${data.certificateNo}`, 230, 440, {
        continued: false,
      })
      .moveDown(0.4)
      .text("Date of issuance ", 180, doc.y, {
        continued: true,
      })
      .text(`: ${data.issueDate}`, 214, doc.y, {
        continued: false,
      })
      .moveDown(0.4)
      .text("Monitoring Period ", 180, doc.y, {
        continued: true,
      })
      .text(`: ${data.monitoringStartDate} - ${data.monitoringEndDate}`, 208, doc.y, {
        continued: false,
      })
      .moveDown(1);

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(`Sri Lankan Credit Emission Reductions: ${data.issuedCredits} (tCO2eq)`, 100, doc.y)
      .moveDown(1.5);

    doc
      .fontSize(11)
      .font("Helvetica")
      .text("Serial Range ", 180, doc.y, {
        continued: true,
      })
      .text(": Block start ", 185, doc.y, {
        continued: true,
      })
      .text(`: ${data.startCreditSerialNo}`, 195, doc.y, {
        continued: false,
      })
      .moveDown(0.4)
      .text(": Block end ", 252, doc.y, {
        continued: true,
      })
      .text(`: ${data.endCreditSerialNo}`, 265, doc.y, {
        continued: false,
      })
      .moveDown(1);

    // Chairman Signature
    const chairmanSignatureImagePath = "public/signatures/ceo.jpg";

    if (fs.existsSync(chairmanSignatureImagePath)) {
      doc.image(chairmanSignatureImagePath, 110, 600, {
        width: 120,
        height: 100,
      });
    } else {
      console.log("Chairmans Signature does not exist in:", chairmanSignatureImagePath);
    }

    doc
      .font("Helvetica")
      .fontSize(10)
      .text("...............................", 130, 660, { align: "left" });

    doc.font("Helvetica").fontSize(10).text("Chairman", 154, 675);

    doc
      .font("Helvetica")
      .fontSize(10)
      .text("Sri Lanka Climate Fund (Pvt) Ltd.", 100, 690, { align: "left" });

    doc.image("images/SLCF_logo.jpg", 260, 600, {
      width: 110,
      height: 100,
    });

    // CEO Signature

    // Define image paths
    const ceoSignatureImagePath = "public/signatures/ceo.jpg";

    if (fs.existsSync(ceoSignatureImagePath)) {
      doc.image(ceoSignatureImagePath, 410, 600, {
        width: 120,
        height: 100,
      });
    } else {
      console.log("CEO Signature does not exist in:", ceoSignatureImagePath);
    }

    doc
      .font("Helvetica")
      .fontSize(10)
      .text("...............................", 410, 660, { align: "left" });

    doc.font("Helvetica").fontSize(11).text("Chief Executive Officer", 400, 675);

    doc
      .font("Helvetica")
      .fontSize(10)
      .text("Sri Lanka Climate Fund (Pvt) Ltd.", 378, 690, { align: "left" });

    doc
      .font("Helvetica")
      .fontSize(9)
      .text(
        "Sri Lanka Climate Fund (Pvt) Ltd, 'Sobadam Piyasa', No. 416/C/1, Robert Gunawardana Mawatha, Battaramulla.",
        70,
        720,
        { align: "center" }
      );

    doc
      .font("Helvetica")
      .fontSize(9)
      .text("Phone: 011 2053065  E-mail: info@climatefund.lk", 70, 730, { align: "center" });

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

    const url = await this.fileHandler.uploadFile("documents/" + filepath, content);

    return url;
  }
}
