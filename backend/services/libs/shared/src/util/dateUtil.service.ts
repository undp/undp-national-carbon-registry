import { Injectable } from "@nestjs/common";

@Injectable()
export class DateUtilService {
  
  //MARK: formatCustomDate
  formatCustomDate(epoch?: string | number) {
    // If an epoch is provided, create a Date object for that epoch; otherwise, use the current date
    const date = epoch ? new Date(parseInt(epoch.toString(), 10)) : new Date();
  
    // Convert to the desired timezone (Asia/Kolkata) using Intl.DateTimeFormat
    const options: Intl.DateTimeFormatOptions = { 
      timeZone: "Asia/Kolkata", 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    };
    const formatter = new Intl.DateTimeFormat("en-US", options);
    const parts = formatter.formatToParts(date);
  
    // Extract year, month, and day
    const year = parts.find(part => part.type === 'year')?.value;
    const month = parts.find(part => part.type === 'month')?.value;
    const day = parts.find(part => part.type === 'day')?.value;
  
    // Return the formatted date string in DD/MM/YYYY format
    return `${day}/${month}/${year}`;
  }
}
