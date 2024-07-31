import { Injectable } from "@nestjs/common";
import * as fs from 'fs';
import { FileHandlerInterface } from '../file-handler/filehandler.interface';
import { DataExportDto } from "../dto/data.export.dto";

@Injectable()
export class DataExportService {
  constructor(private fileHandler: FileHandlerInterface,) {

  };

  async generateCsv(data: DataExportDto[], headers: string[], fileName: string) {

    const currentDate = new Date();

    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Adding 1 to month since it's zero-indexed
    const day = currentDate.getDate().toString().padStart(2, '0');
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const seconds = currentDate.getSeconds().toString().padStart(2, '0');

    const formattedDateTime = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    // console.log(formattedDateTime); // Output: 2023-12-08_14-04-20

    const csvFile = fileName + '_' + formattedDateTime + '.csv';

    let csvContent = ''

    const refinedData = [];
    refinedData.push(headers);

    data.forEach(item => {
      const values = Object.values(item).map(value => (value === undefined || value === null) ? "" : value);
      refinedData.push(values);
    });


    refinedData.forEach(row => {
      const rowValues = row.map(value => `"${value}"`).join(',');
      csvContent += rowValues + '\n';
    });

    fs.writeFileSync(csvFile, csvContent);
    const content = fs.readFileSync(csvFile, { encoding: 'base64' });
    const url = await this.fileHandler.uploadFile('documents/exports/' + csvFile, content);
    console.log('========================PDF generate end', 'exports/', url);
    return { url, csvFile };
  }
}


