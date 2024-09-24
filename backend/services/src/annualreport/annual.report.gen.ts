import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { FileHandlerInterface } from '../file-handler/filehandler.interface';
const PDFDocument = require('pdfkit');
const fs = require('fs');
import { Programme } from '../entities/programme.entity';
import { ProgrammeTransfer } from '../entities/programme.transfer';
import { Country } from '../entities/country.entity';
import { ProgrammeLedgerService } from '../programme-ledger/programme-ledger.service';
import { ProgrammeService } from '../programme/programme.service';
import { CompanyService } from '../company/company.service';
@Injectable()
export class AnnualReportGen {
  constructor(
    @InjectRepository(Programme) private programmeRepo: Repository<Programme>,
    @InjectRepository(ProgrammeTransfer)
    private programmeTransfer: Repository<ProgrammeTransfer>,
    @InjectRepository(Country) private CountryRepo: Repository<Country>,
    private configService: ConfigService,
    private fileHandler: FileHandlerInterface,
    private programmeLedgerService: ProgrammeLedgerService,
    private programmeService: ProgrammeService,
    private companyService: CompanyService,
  ) {}

  async generateAnnualReportpdf(
    date
    ) {
    try{
        const country = this.configService.get('systemCountryName');
        const host = this.configService.get('host');
        let currentPage = 0;
        //Report in PDF format
        const doc = new PDFDocument({ margin: 30, size: 'B0' ,bufferPages: true});
        const filepath = `Annual_Report_${country}_${date}.pdf`
        const stream = fs.createWriteStream("/tmp/" + filepath);
        doc.pipe(stream);
        doc.font('Times-Roman');
        doc.fontSize(11);
        doc.font('Times-Bold').fontSize(11).text('\n\nTable 1: Heading');
        doc
        .lineCap('butt')
        .strokeColor('#000000')
        .lineWidth(2)
        .moveTo(26, 73)
        .lineTo(250, 73)
        .stroke();
        doc
        .font('Times-Bold')
        .fontSize(11)
        .text('\nParty', {
            continued: true,
        })
        .lineGap(5)
        .font('Times-Roman')
        .text(`                                            ${country}`);
        doc
        .font('Times-Bold')
        .fontSize(11)
        .text('Reported year(a)', {
            continued: true,
        })
        .font('Times-Roman')
        .text(`                             ${date}`);
        doc
        .lineCap('butt')
        .strokeColor('#000000')
        .lineWidth(2)
        .moveTo(26, 120)
        .lineTo(250, 120)
        .stroke();

        doc.text(
        '\n(a) The annual period from 1 January to 31 December during which actions occurred.',
        );

        doc.font('Times-Bold').fontSize(11).text('\n\nTable 2: Actions');
        function columnnames(){
        // Table 2 Main Line
        doc
            .lineCap('butt')
            .strokeColor('#000000')
            .lineWidth(1)
            .moveTo(26, 205)
            .lineTo(2625, 205)
            .stroke();
        // ITMO Line
        doc
            .lineCap('butt')
            .strokeColor('#000000')
            .lineWidth(1)
            .moveTo(225, 225)
            .lineTo(1400, 225)
            .stroke();
        // Actions Line
        doc
            .lineCap('butt')
            .strokeColor('#000000')
            .lineWidth(1)
            .moveTo(1920, 225)
            .lineTo(2625, 225)
            .stroke();
        // Unique identifier Line
        doc
            .lineCap('butt')
            .strokeColor('#000000')
            .lineWidth(1)
            .moveTo(225, 245)
            .lineTo(600, 245)
            .stroke();
        // Metric and quantity Line
        doc
            .lineCap('butt')
            .strokeColor('#000000')
            .lineWidth(1)
            .moveTo(630, 245)
            .lineTo(1000, 245)
            .stroke();
        // ITMO details Line
        doc
            .lineCap('butt')
            .strokeColor('#000000')
            .lineWidth(1)
            .moveTo(1025, 245)
            .lineTo(1400, 245)
            .stroke();
        // Authorization Line
        doc
            .lineCap('butt')
            .strokeColor('#000000')
            .lineWidth(1)
            .moveTo(1430, 245)
            .lineTo(1810, 245)
            .stroke();
        // Action details Line
        doc
            .lineCap('butt')
            .strokeColor('#000000')
            .lineWidth(1)
            .moveTo(1920, 245)
            .lineTo(2520, 245)
            .stroke();
        doc
            .font('Times-Italic')
            .text('ITMO', 750, 210, { continued: true })
            .text('Actions', 2300, 210);
        doc
            .font('Times-Italic')
            .text('Unique identifier', 350, 230, { continued: true })
            .text('Metric and quantity', 670, 230, { continued: true })
            .text('ITMO details', 990, 230, { continued: true })
            .text('Authorization', 1350, 230, { continued: true })
            .text('Action details', 1900, 230);

        const lorem = [
            'Article 6 database record ID',
            '  Cooperative approach(a)',
            'First unique identifier(b)',
            'Last unique identifier(c)',
            'Underlying unit block start ID(d)',
            'Underlying unit last block end(e)',
            'Metric(f)',
            'Quantity (expressed in metric)(g)',
            'Quantity (t CO2 eq)',
            'Conversion factor  (reporting Party)(h)',
            'First transferring participating Party(i)',
            'Vintage(j)',
            'Sector(s)(k)',
            'Activity type(s)(l)',
            'Date of authorization(m)',
            'Authorization ID(n)',
            'Purposes for authorization',
            'OIMP authorized by the Party(o)',
            'First transfer definition(p)',
            'Action date(q)',
            'Action type(r)',
            'Transferring participating Party(s)',
            'Acquiring participating Party(t)',
            'Purposes for cancellation(u)',
            'Using participating Party or authorized entity or entities',
            'First transfer(v)',
        ];
        for (const rows in lorem) {
            const isBold = [
            'Article 6 database record ID',
            '  Cooperative approach(a)',
            'First unique identifier(b)',
            'Last unique identifier(c)',
            'Metric(f)',
            'Quantity (t CO2 eq)',
            'First transferring participating Party(i)',
            'Vintage(j)',
            'Sector(s)(k)',
            'Activity type(s)(l)',
            'Date of authorization(m)',
            'Authorization ID(n)',
            'Purposes for authorization',
            'OIMP authorized by the Party(o)',
            'First transfer definition(p)',
            'Action date(q)',
            'Action type(r)',
            'Transferring participating Party(s)',
            'Acquiring participating Party(t)',
            'Purposes for cancellation(u)',
            'Using participating Party or authorized entity or entities',
            'First transfer(v)',
            ].includes(lorem[rows]);
            if (isBold) {
            doc.font('Times-BoldItalic');
            }
            doc.text(lorem[rows], Number(rows) * 100 + 40, 270, {
            columns: 1,
            lineGap: 0,
            width: 90,
            });
            doc.font('Times-Italic');
        }
        doc
            .lineCap('butt')
            .strokeColor('#000000')
            .lineWidth(2)
            .moveTo(26, 335)
            .lineTo(2625, 335)
            .stroke();
        }
        columnnames()
        const table = {
        rows: [],
        columnWidths: [80, 80, 80, 80, 80],
        yStart: doc.y + 65,
        yStartNewpage: doc.y + 65,
        margin: 15,
        };

        function addTableRow(data) {
        table.rows.push(data);
        }

        function drawTable() {
        let y = table.yStart;

        table.rows.forEach((row, rowIndex) => {
            let maxCellHeight = 0;
            row.forEach((cell, columnIndex) => {
            const cellHeight = doc.heightOfString(cell, {
                width: 90,
                align: 'left',
            });
            if (cellHeight > maxCellHeight) {
                maxCellHeight = cellHeight;
            }
            const column = String(cell);
            if (column.startsWith('Programme') == true) {
                const id = column.split('-')[2];

                doc
                .fontSize(8)
                .font('Times-Roman')
                .text(cell, 30 + table.margin + columnIndex * 100, y, {
                    link: `${host}/programmeManagement/view/${id}`,
                    width: 90,
                    align: 'left',
                });
            } else {
                // Regular text
                doc
                .fontSize(8)
                .font('Times-Roman')
                .text(cell, 30 + table.margin + columnIndex * 100, y, {
                    width: 90,
                    align: 'left',
                });
            }
            // doc
            //   .fontSize(8)
            //   .font('Times-Roman')
            //   .text(cell, 30 + table.margin + columnIndex * 100, y, {
            //     width: 100,
            //     align: 'left',
            //   });
            });
            y += maxCellHeight + 10;
            if (y > doc.page.height - 50) {
            currentPage++;
            doc.addPage();
            doc.switchToPage(currentPage);
            columnnames()
            addTableRow([" "," "," "," ",'','','','',' ',' ',' ',' ',' ', ' ', ' ', ` `, ' ',  ' ',  ' ',  ' ', ' ', ' ',  ' ',  ' ',  ' ',  ' \n',]);
            y = table.yStartNewpage;
            }
        });
        }
        const january1st = new Date(date, 0, 1).getTime() / 1000;
        const december31st = new Date(date, 11, 31, 23, 59, 59).getTime() / 1000;
        const authissueqry = `SELECT * FROM public.programme WHERE  "currentStage"='Authorised' ORDER BY "authTime" ASC`;
        const authissuestable = await this.programmeRepo.query(authissueqry);
        addTableRow([" "," "," "," ",'','','','',' ',' ',' ',' ',' ', ' ', ' ', ` `, ' ',  ' ',  ' ',  ' ', ' ', ' ',  ' ',  ' ',  ' ',  ' \n',]);
        for (const programme of authissuestable) {
            const programmeid = programme.programmeId;
            const programmename = programme.title;
            const serialNo = programme.serialNo;
            const scope = programme.sectoralScope;
            const date = new Date(Number(programme.createdTime));
            const vintage = date.getFullYear();
            let sector: string;
            if (scope == 1 || scope == 2 || scope == 3 || scope == 7) {
                sector = 'Energy';
            } else if (
                scope == 4 ||
                scope == 5 ||
                scope == 6 ||
                scope == 8 ||
                scope == 9 ||
                scope == 10 ||
                scope == 11 ||
                scope == 12
            ) {
                sector = 'IPPU';
            } else if (scope == 14 || scope == 15) {
                sector = 'AFOLU';
            } else {
                sector = 'Waste';
            }
            var firstowners = []
            const historydata = await this.programmeLedgerService.getProgrammeHistory(programmeid);
            for (const creditdata of historydata){
                if(creditdata.data.txType=='0'){
                    for (const id of creditdata.data.companyId){
                        const company = await this.companyService.findByCompanyId(id)
                        firstowners.push(company.name)
                    }
                }
                if (january1st*1000< creditdata.data.txTime && creditdata.data.txTime<december31st*1000
                    && creditdata.data.currentStage=='Authorised'
                    && (creditdata.data.txType=='8'|| creditdata.data.txType=='2')){
                    const txDate = new Date(Number(creditdata.data.txTime))
                    .toISOString()
                    .split('T')[0];
                    const creditissue = creditdata.data.creditIssued
                    let credit:number
                    let status:string
                    if (creditissue==0 && creditdata.data.txType=='8'){
                        status='Authorisation'  
                        credit = creditdata.data.creditEst;     
                    }
                    if (creditissue>0 && creditdata.data.txType=='2'){
                        status = 'Issuance'
                        credit = creditdata.data.creditChange;
                    }
                    var sendrecive = []
                    for (const id of creditdata.data.companyId){
                        const company = await this.companyService.findByCompanyId(id)
                        sendrecive.push(company.name)
                    }
                    addTableRow([
                        programmeid,
                        programmename,
                        serialNo.split('-')[6],
                        Number(serialNo.split('-')[7]),
                        '',
                        '',
                        'GHG',
                        '',
                        credit,
                        '',
                        firstowners.join(","),
                        "  "+vintage,
                        sector,
                        status,
                        txDate,
                        `Programme-ID-${programmeid}`,
                        '    NDC',
                        ' ',
                        status,
                        txDate,
                        status,
                        sendrecive.join(","),
                        sendrecive.join(","),
                        '',
                        sendrecive.join(","),
                        ' \n',
                    ]);
                }
            }
            const tranfretireqry = `SELECT * FROM public.programme_transfer WHERE ("status"='Approved' OR "status"='Recognised') AND "programmeId"= '${programmeid}'  ORDER BY "authTime" ASC`;
            const transfertable = await this.programmeTransfer.query(tranfretireqry);
            for (const tnrprogramme of transfertable) {
                if(january1st*1000< tnrprogramme.txTime && tnrprogramme.txTime<december31st*1000){
                    const findprogramme = await this.programmeService.findById(tnrprogramme.programmeId)
                    const programmename = findprogramme.title;
                    const serialNo = String(findprogramme.serialNo);
                    const date = new Date(Number(findprogramme.createdTime));
                    const vintage = date.getFullYear();
                    let type: string;
                    let def: string;
                    if (tnrprogramme.status == `Recognised`) {
                        type = 'Retirement';
                        def = 'Cancellation';
                    } else {
                        type = 'Transfer';
                        def = 'Use';
                    }
                    const credit = Number(tnrprogramme.creditAmount);
                    const scope = findprogramme.sectoralScope;
                    let sector: string;
                    if (scope == '1' || scope == '2' || scope == '3' || scope == '7') {
                        sector = 'Energy';
                    } else if (
                        scope == '4' ||
                        scope == '5' ||
                        scope == '6' ||
                        scope == '8' ||
                        scope == '9' ||
                        scope == '10' ||
                        scope == '11' ||
                        scope == '12'
                    ) {
                        sector = 'IPPU';
                    } else if (scope == '14' || scope == '15') {
                        sector = 'AFOLU';
                    } else {
                        sector = 'Waste';
                    }
                    let purpose: string;
                    if (def == 'Cancellation') {
                        if (tnrprogramme.retirementType == '0') {
                        purpose = 'Cross-border transfer';
                        } else if (tnrprogramme.retirementType == '1') {
                        purpose = 'Legal Action';
                        } else {
                        purpose = 'Other';
                        }
                    } else {
                        purpose = '';
                    }
                    let receiver:string
                    if (tnrprogramme.toCompanyMeta !=null){
                        const alpha2 = tnrprogramme.toCompanyMeta.country
                        const receive = await this.CountryRepo.query(
                        `SELECT * FROM public.country WHERE "alpha2"='${alpha2}'`,
                        );
                        receiver = receive[0].name
                    }
                    else{
                        const receive = await this.companyService.findByCompanyId(tnrprogramme.toCompanyId);
                        receiver = receive.name
                    }
                    const send = await this.companyService.findByCompanyId(tnrprogramme.fromCompanyId);
                    const authDate = new Date(Number(tnrprogramme.authTime))
                    .toISOString()
                    .split('T')[0];
                    addTableRow([
                        tnrprogramme.programmeId,
                        programmename,
                        serialNo.split('-')[6],
                        serialNo.split('-')[7],
                        '',
                        '',
                        'GHG',
                        '',
                        credit,
                        '',
                        firstowners.join(","),
                        "  "+vintage,
                        sector,
                        type,
                        authDate,
                        `Programme-ID-${tnrprogramme.programmeId}`,
                        '    NDC',
                        ' ',
                        def,
                        authDate,
                        def,
                        send.name,
                        receiver,
                        purpose,
                        receiver,
                        '\n',
                    ]);  
                }     
            }
        }
        addTableRow([" "," "," "," ",'','','','',' ',' ',' ',' ',' ', ' ', ' ', ` `, ' ',  ' ',  ' ',  ' ', ' ', ' ',  ' ',  ' ',  ' ',  ' \n',]);
        drawTable();

        doc
        .lineCap('butt')
        .strokeColor('#000000')
        .lineWidth(2)
        .moveTo(26, doc.y + 30)
        .lineTo(2625, doc.y + 30)
        .stroke();
        doc
        .font('Times-Roman')
        .fontSize(9)
        .text(
            `        (a) Name/ID of the cooperative approach as per common nomenclatures.*\n
        (b) First ITMO unique identifier.\n
        (c) Last ITMO unique identifier. \n
        (d) Underlying unit block start ID for ITMOs recorded on the basis of cooperative approach units tracked in an underlying cooperative approach registry.\n
        (e) Underlying unit block end ID for ITMOs recorded on the basis of cooperative approach units tracked in a an underlying cooperative approach registry.\n
        (f) GHG or non-GHG.\n
        (g) For non-GHG, the metric in which the ITMO was generated as per common nomenclatures.\n
        (h) The conversion method or factor of the non-GHG units in the reporting Party’s as per decision 2/CMA.3, annex, para. 22(d).\n
        (i) Participating Party in which the mitigation outcome was generated as per common nomenclatures.\n
        (j) Year in which the mitigation outcome occurred.\n
        (k) Sector(s) where the mitigation outcome occurred as per common nomenclatures based on IPCC guidelines.\n
        (l) Description of the mitigation activity type(s) as per common nomenclatures.\n
        (m) Date of authorization by first transferring Party.\n
        (n) Authorization ID as assigned by the first transferring Party, may include a link to the public evidence of authorization by the first transferring Party.\n
        (o) Fill when “Purposes for authorization” is “OIMP” or “NDC and OIMP”.\n
        (p) If OIMP is authorized, the first transferring participating Party definition of “first transfer” as per decision 2/CMA.3, annex, para. 2(b).\n
        (q) Date on which the action was executed in the registry of the reporting Party.\n
        (r) Action type as per decision 2/CMA.3, annex, paragraph 20(a) and any further relevant guidance. \n
        (s) Initiating participating Party, including for cancellations and uses.\n
        (t) Participating Party receiving the ITMOs.\n
        (u) For relevant actions, the specific purposes for cancellation towards which ITMOs can be or were used.\n
        (v) Approach for first transfer as per decision 2/CMA.3, annex, paragraph 2 to be clarified, subject to defining the list of actions as per note “r” above. \n
        * Common nomenclature to be established as per decision -/CMA.4`,
            26,
            doc.y + 40,{align: 'left'}
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
    catch (error) {
        console.error('Error while generate the annual report', error);
      }
  }

  //   async generateAnnualReportexcel(
  //     excelpath,
  //   ) {
  //     const authqry = `SELECT * FROM public.programme WHERE "currentStage"='Authorised'`
  //     const tranfretireqry = `SELCR * FROM public.programme_transfer WHERE "status"='Approved OR "status"='Recognised'`
  //     const authprogrammestable = await this.programmeRepo.query(authqry)
  //     const transfertable = await this.programmeTransfer.query(tranfretireqry)
  //     const programecount = authprogrammestable.length + transfertable.length;
  //     console.log(transfertable)
  //     console.log(programecount)
  //     // console.log("PassHere")
  //     const country =await this.configService.get("systemCountryName");
  //     // const minister =await this.configService.get("docGenerate.ministerName");
  //     // const ministry =await this.configService.get('docGenerate.ministryName');
  //     const year = new Date().getFullYear();
  //     const report_year = (Number(year)-1)
  //     const xlsxFile = excelpath;
  //     console.log(xlsxFile)
  //     const targetSheet = 'Actions';
  //     try {
  //       const workbook = XLSX.readFile(xlsxFile);
  //       const sheet = workbook.Sheets[targetSheet];
  //       if (!sheet) {
  //         console.error(`Sheet "${targetSheet}" not found in the XLSX file.`);
  //         process.exit(1);
  //       }
  //       let startrow = 11
  //       const range = XLSX.utils.decode_range(sheet['!ref']);
  //       for (let i = 0; i < programecount; i++) {
  //         for (let r = range.e.r; r >= startrow; r--) {
  //           for (let c = range.s.c; c <= range.e.c; c++) {
  //             const fromCell = XLSX.utils.encode_cell({ c: c, r: r });
  //             const toCell = XLSX.utils.encode_cell({ c: c, r: r + 1 });
  //             sheet[toCell] = sheet[fromCell];
  //           }
  //         }
  //           for (let c = range.s.c; c <= range.e.c; c++) {
  //           const cellAddress = XLSX.utils.encode_cell({ c: c, r: startrow });
  //           sheet[cellAddress] = { t: 's', v: '' };
  //         }

  //         range.e.r++;
  //       }

  //       // const ranges = { s: { c: 1, r: 1 }, e: { c: 2, r: 2 } }; // B2:C3
  //       // sheet['!merges'] = [{ range: ranges, style: { border: { right: { style: 'thin', color: { auto: 1 } } } } }];

  //       let datainputrow = 11
  //       //Authorised Credits
  //       for (const item of authprogrammestable) {
  //         const programmeid = item.programmeId;
  //         const programmename = item.title;
  //         const serialNo = item.serialNo;
  //         const authcredit = Number(item.creditEst)
  //         const scope = item.sectoralScope
  //         let sector : string
  //         if (scope==1 || scope==2|| scope==3|| scope==7){
  //           sector = "Energy"
  //         }
  //         else if(scope==4 || scope==5|| scope==6|| scope==8|| scope==9|| scope==10|| scope==11|| scope==12){
  //           sector = "IPPU"
  //         }
  //         else if(scope==14 || scope==15){
  //           sector = "AFOLU"
  //         }
  //         else{
  //           sector = "Waste"
  //         }
  //         console.log(sector)
  //         sheet[`B${datainputrow}`] = {t: 's', v: programmeid };
  //         sheet[`C${datainputrow}`] = {t: 's', v: programmename };
  //         sheet[`D${datainputrow}`] = {t: 's', v: serialNo.split('-')[6] };
  //         sheet[`E${datainputrow}`] = {t: 's', v: Number(serialNo.split('-')[6])+authcredit-1 };
  //         sheet[`F${datainputrow}`] = {t: 's', v: "" };
  //         sheet[`G${datainputrow}`] = {t: 's', v: "" };
  //         sheet[`I${datainputrow}`] = {t: 's', v: "GHG" };
  //         sheet[`J${datainputrow}`] = {t: 's', v: "" };
  //         sheet[`K${datainputrow}`] = {t: 's', v: authcredit };
  //         sheet[`L${datainputrow}`] = {t: 's', v: "" };
  //         sheet[`N${datainputrow}`] = {t: 's', v: "" };
  //         sheet[`O${datainputrow}`] = {t: 's', v: item.createdTime };
  //         sheet[`P${datainputrow}`] = {t: 's', v: sector };
  //         sheet[`Q${datainputrow}`] = {t: 's', v: "Authorisation" };
  //         sheet[`S${datainputrow}`] = {t: 's', v: item.createdTime };
  //         sheet[`T${datainputrow}`] = {t: 's', v: "" };
  //         sheet[`U${datainputrow}`] = {t: 's', v: "NDC" };
  //         sheet[`V${datainputrow}`] = {t: 's', v: "" };
  //         sheet[`W${datainputrow}`] = {t: 's', v: "Authorization" };
  //         sheet[`Y${datainputrow}`] = {t: 's', v: item.createdTime };
  //         sheet[`Z${datainputrow}`] = {t: 's', v: "Authorisation " };
  //         sheet[`AA${datainputrow}`] = {t: 's', v: "to be filled" };
  //         sheet[`AB${datainputrow}`] = {t: 's', v: "to be filled" };
  //         sheet[`AC${datainputrow}`] = {t: 's', v: "Not Cancellation" };
  //         sheet[`AD${datainputrow}`] = {t: 's', v: "to be filled" };
  //         sheet[`AE${datainputrow}`] = {t: 's', v: "" };
  //         datainputrow = datainputrow + 1
  //       }

  //       XLSX.writeFile(workbook, `Annual_Report_${country}.xlsx`);
  //     } catch (error) {
  //       console.error(`An error occurred: ${error}`);
  //     }
  // }
}
