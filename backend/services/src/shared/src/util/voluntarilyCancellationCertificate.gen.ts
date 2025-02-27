import { Injectable } from "@nestjs/common";
import { FileHandlerInterface } from "../file-handler/filehandler.interface";
const PDFDocument = require("pdfkit");
const fs = require("fs");

export interface VoluntarilyCancellationCertificateData {
  companyName: string;
  noOfSCERs: number;
  yearVerified: number;
  transactionReference: string;
  dateOfTransaction: string;
  startSerialNumber: string;
  endSerialNumber: string;
  totalSCERs: number;
  documentDate: string;
  projectName: string;
  projectProponent: string;
}

@Injectable()
export class VoluntarilyCancellationCertificateGenerator {
  constructor(private fileHandler: FileHandlerInterface) {}

  async generateVoluntaryCancellationCertificate(
    data: VoluntarilyCancellationCertificateData,
    isPreview?: boolean
  ) {
    const doc = new PDFDocument({
      margin: 50,
    });
    const refFileName = data.transactionReference.replace(/\//g, "_");
    const filepath = `VOLUNTARY_CANCELLATION_CERTIFICATE_${refFileName}.pdf`;

    // Define the output file path
    const stream = fs.createWriteStream("/tmp/" + filepath);
    doc.pipe(stream);

    // Add logo
    const image1Width = 40;
    const image2Width = 60;
    const image3Width = 100;

    const imageHeight = 50;

    const spaceBetweenImages = 10;

    const totalImageWidth = image1Width + image2Width + image3Width + 2 * spaceBetweenImages;

    // Start position for the first image (centering all images on the page)
    const startImageX = (doc.page.width - totalImageWidth) / 2;
    const startImageY = 50; // vertical position where images will be placed

    // Draw each image
    doc.image("images/sri-lanka-emblem.png", startImageX, startImageY, {
      width: image1Width,
      height: imageHeight,
    });
    doc.image("images/SLCF_logo.jpg", startImageX + image1Width + spaceBetweenImages, startImageY, {
      width: image2Width,
      height: imageHeight,
    });
    doc.image(
      "images/SLCCS_logo.png",
      startImageX + (image1Width + image2Width + 2 * spaceBetweenImages),
      startImageY,
      {
        width: image3Width,
        height: imageHeight,
      }
    );
    doc.moveDown(2);

    // Title
    doc
      .fontSize(26)
      .font("Times-Bold")
      .fillColor("green")
      .text("VOLUNTARY CANCELLATION CERTIFICATE", { align: "center" });

    if (isPreview) {
      this.addPreviewWatermark(doc);
    }

    // "Presented to:" Text
    doc.moveDown(2).fontSize(14).fillColor("black");

    const labelText = "Presented to: ";
    const labelWidth = doc.widthOfString(labelText, { font: "Helvetica" });
    const valueText = `${data.companyName}`;
    const valueWidth = doc.widthOfString(valueText, { font: "Helvetica-Bold" });
    const totalWidthPresentedTo = labelWidth + valueWidth;
    const startXPresentedTo = (doc.page.width - totalWidthPresentedTo) / 2;

    // Print "Presented to:" and company name
    doc.font("Helvetica").text(labelText, startXPresentedTo, 220, { continued: true });
    doc.font("Helvetica-Bold").text(valueText, doc.x, doc.y, { continued: false });

    doc.moveDown(1);

    // "Presented by:" Text
    const labelByText = "Presented by: ";
    const labelByWidth = doc.widthOfString(labelByText, { font: "Helvetica" });
    const valueByText = "CountryX Climate Fund (Pvt) Ltd.";
    const valueByWidth = doc.widthOfString(valueByText, { font: "Helvetica-Bold" });
    const totalWidthPresentedBy = labelByWidth + valueByWidth;
    const startXPresentedBy = (doc.page.width - totalWidthPresentedBy) / 2;

    // Print "Presented by:" and organization name
    doc.font("Helvetica").text(labelByText, startXPresentedBy, doc.y, { continued: true });
    doc.font("Helvetica-Bold").text(valueByText, doc.x, doc.y, { continued: false });

    doc.moveDown(2);

    doc.fontSize(14);

    // Calculate text width for alignment
    const numberText = `${data.noOfSCERs} SCERs`;
    const unitText = "(tCO2 equivalent)";
    const numberWidth = doc.widthOfString(numberText, { font: "Helvetica-Bold" });
    const unitWidth = doc.widthOfString(unitText, { font: "Helvetica" });

    // Calculate total width and starting position for centering
    const totalWidth = numberWidth + unitWidth;
    const startX = (doc.page.width - totalWidth) / 2; // Center the entire line on the page

    // Print the first part in bold
    doc.font("Helvetica-Bold").text(numberText, startX, doc.y, { continued: true });

    // Add a small space between texts to prevent overlapping
    doc.text(" ", { continued: true });

    // Print the second part in regular font
    doc.font("Helvetica").text(unitText, doc.x, doc.y, { continued: false });

    // Move down after the combined text
    doc.moveDown(1);

    // Cancellation Details
    doc
      .fontSize(14)
      .font("Helvetica")
      .text(`From ${data.projectName} is cancelled to inset`, 50, 330, { align: "center" })
      .text("organizational level GHG emissions", 50, 360, { align: "center" })
      .text("of", 50, 390, { align: "center" });

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(`${data.companyName}`, 50, 415, { align: "center" });

    doc
      .fontSize(14)
      .font("Helvetica")
      .text(`quantified and verified for the year ${data.yearVerified}.`, 50, 450, {
        align: "center",
      });

    doc
      .fontSize(12)
      .font("Helvetica")
      .text("Transaction reference ", 85, 495, {
        continued: true,
      })
      .text(`: ${data.transactionReference}`, 143, 495, {
        continued: false,
      })
      .moveDown(1)
      .text("Date of cancellation transaction ", 85, doc.y, {
        continued: true,
      })
      .text(`: ${data.dateOfTransaction}`, 90, doc.y, {
        continued: false,
      })
      .moveDown(1)
      .text("Start serial number ", 85, doc.y, {
        continued: true,
      })
      .text(`: ${data.startSerialNumber}`, 155, doc.y, {
        continued: false,
      })
      .moveDown(1)
      .text("End serial number ", 85, doc.y, {
        continued: true,
      })
      .text(`: ${data.endSerialNumber}`, 160, doc.y, {
        continued: false,
      })
      .moveDown(1)
      .text("Total number of SCERs ", 83, doc.y, {
        continued: true,
      })
      .text(`: ${data.totalSCERs}`, 132, doc.y, {
        continued: false,
      })
      .moveDown(1);

    doc
      .font("Helvetica")
      .fontSize(11)
      .text(`Date: ${data.documentDate}`, 70, 650, { align: "left" });

    doc
      .font("Helvetica")
      .fontSize(9)
      .text(
        `${data.projectName} is developed and registered under CountryX Carbon Crediting Scheme by ${data.projectProponent}, a subsidiary of ${data.projectProponent} in the interest of obtaining carbon credits for internal offsetting.`,
        70,
        680,
        { align: "left" }
      );

    doc.opacity(0.2);
    doc.image("images/SLCF_logo.jpg", 80, 280, {
      width: 500,
      height: 500,
    });
    doc.restore();
    doc.opacity(1);
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
