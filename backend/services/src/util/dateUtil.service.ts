import { Injectable } from "@nestjs/common";

@Injectable()
export class DateUtilService {
    //MARK: formatCustomDate
    formatCustomDate(epoch?) {
      // If an epoch is provided, create a Date object for that epoch; otherwise, use the current date
      const date = epoch ? new Date(parseInt(epoch, 10)) : new Date();
  
      // Extract year, month, and day
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // getMonth returns 0-11, so add 1 to adjust to 1-12
      const day = date.getDate();
  
      // Pad the month and day to ensure they are always two digits
      const formattedMonth = month.toString().padStart(2, "0");
      const formattedDay = day.toString().padStart(2, "0");
  
      // Return the formatted date string in YYYY/MM/DD format
      return `${year}/${formattedMonth}/${formattedDay}`;
    }
}