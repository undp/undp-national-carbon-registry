import { Injectable } from "@nestjs/common";
import { FileHandlerInterface } from "../file-handler/filehandler.interface";
import { CreditType } from "../enum/creditType.enum";
const PDFDocument = require("pdfkit");
const fs = require("fs");

export interface CarbonNeutralCertificateData {
  projectName: string;
  companyName: string;
  scope: string;
  certificateNo: string;
  issueDate: string;
  creditAmount: number;
  orgBoundary: string;
  assessmentYear: number;
  assessmentPeriod: string;
}

@Injectable()
export class CarbonNeutralCertificateGenerator {
  constructor(private fileHandler: FileHandlerInterface) {}

  async generateCarbonNeutralCertificate(data: CarbonNeutralCertificateData, isPreview?: boolean) {
    const doc = new PDFDocument({
      margin: 50,
    });

    const refFileName = data.certificateNo.replace(/\//g, "_");
    const filepath = `CARBON_NEUTRAL_CERTIFICATE_${refFileName}.pdf`;

    // Define the output file path
    const stream = fs.createWriteStream("/tmp/" + filepath);
    doc.pipe(stream);

    // Add logo
    const image1Width = 45;
    const image2Width = 75;

    const imageHeight = 60;
    const image2Height = 65;

    const spaceBetweenImages = 15;

    const totalImageWidth = image1Width + image2Width + 2 * spaceBetweenImages;

    const startImageX = (doc.page.width - totalImageWidth) / 2;
    const startImageY = 50;

    // Draw each image
    doc.image("images/sri-lanka-emblem.png", startImageX, startImageY, {
      width: image1Width,
      height: imageHeight,
    });
    doc.image("images/SLCF_logo.jpg", startImageX + image1Width + spaceBetweenImages, startImageY, {
      width: image2Width,
      height: image2Height,
    });
    doc.moveDown(2);

    // Title
    doc
      .fontSize(30)
      .font("Helvetica-Bold")
      .fillColor("#134e9e")
      .text("Carbon Neutral Certificate", { align: "center" });

    if (isPreview) {
      this.addPreviewWatermark(doc);
    }

    doc.moveDown(2).fontSize(16).fillColor("black");

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(`Presented to: ${data.companyName}`, 70, 180, { align: "center" });
    doc.moveDown(0.5);
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("Presented by: Sri Lanka Climate Fund (PVT) Ltd.", { align: "center" });

    doc.moveDown(1);

    doc
      .font("Helvetica")
      .fontSize(12)
      .text("Sri Lanka Climate Fund (PVT) Ltd. certifies that", { align: "center" });

    doc.moveDown(0.5);

    doc.font("Helvetica").fontSize(12).text(`${data.companyName}`, { align: "center" });

    doc.moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(12)
      .text(`has inset its ${data.scope} GHG Emissions of ${data.creditAmount} tCO2e`, {
        align: "center",
      });

    doc.moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(12)
      .text(`quantified and verified for the calender year ${data.assessmentYear}`, {
        align: "center",
      });

    doc.moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(12)
      .text("Sri Lankan Certified Emission Reductions (SCER) of", { align: "center" });

    doc.moveDown(0.5);

    doc.font("Helvetica").fontSize(12).text(`${data.projectName}`, { align: "center" });

    doc.moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(12)
      .text(`registered under Sri Lanka Carbon Crediting Scheme (SLCCS)`, { align: "center" });

    doc.moveDown(1);
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(`Assessment of ${data.scope} GHG Statement`, { align: "center" });
    doc.moveDown(1);

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("green")
      .text("Scope ", 180, doc.y, {
        continued: true,
      })
      .font("Helvetica")
      .text(`: ${data.scope}`, 291, doc.y, {
        continued: false,
      })
      .moveDown(0.4)
      .font("Helvetica-Bold")
      .text("Methodology", 180, doc.y, {
        continued: true,
      })
      .font("Helvetica")
      .text(`: ISO 14064-1-2018`, 259, doc.y, {
        continued: false,
      })
      .moveDown(0.4)
      .font("Helvetica-Bold")
      .text("Organization Boundary ", 180, doc.y, {
        continued: true,
      })
      .text('')
      .font("Helvetica")
      .text(`: ${data.orgBoundary}`, 334, doc.y, {
        continued: false,
        indent: -7
      })
      .moveDown(0.4)
      .font("Helvetica-Bold")
      .text("Period of Assessment ", 180, doc.y, {
        continued: true,
      })
      .font("Helvetica")
      .text(`: ${data.assessmentPeriod}`, 208, doc.y, {
        continued: false,
      })
      .moveDown(0.4)
      .font("Helvetica-Bold")
      .text("Verified by ", 180, doc.y, {
        continued: true,
      })
      .font("Helvetica")
      .text(`: Sri Lanka Climate Fund (Pvt) Ltd.`, 268, doc.y, {
        continued: false,
      })
      .moveDown(1);

    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("black")
      .text("Certificate No ", 200, doc.y, {
        continued: true,
      })
      .text(`: ${data.certificateNo}`, 237, doc.y, {
        continued: false,
      })
      .moveDown(0.4)
      .text("Date of Issues ", 200, doc.y, {
        continued: true,
      })
      .text(`: ${data.issueDate}`, 233, doc.y, {
        continued: false,
      })
      .moveDown(1);

    // Chairman Signature
    const chairmanSignatureImagePath = "public/signatures/chairman.jpg";

    if (fs.existsSync(chairmanSignatureImagePath)) {
      doc.image(chairmanSignatureImagePath, 110, 579, {
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

    doc.image("images/carbonNeutralLogo.jpg", 260, 580, {
      width: 110,
      height: 110,
    });

    // CEO Signature

    // Define image paths
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
