import { RcFile } from 'antd/lib/upload';
import { getBase64 } from '../Definitions/Definitions/programme.definitions';

export const calculateDifference = (startTimestamp: number, endTimestamp: number) => {
  const startDate = new Date(startTimestamp);
  const endDate = new Date(endTimestamp);

  const years = endDate.getFullYear() - startDate.getFullYear();
  const months = endDate.getMonth() - startDate.getMonth();
  const days = endDate.getDate() - startDate.getDate();

  // if (days < 0) {
  //   months--;
  //   const previousMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0); // Get the last day of the previous month
  //   days += previousMonth.getDate(); // Add the days from the previous month
  // }

  // // Adjust if months are negative
  // if (months < 0) {
  //   years--;
  //   months += 12;
  // }

  return { years, months, days };
};

export const fileUploadValueExtract = async (formValues: any, key: string) => {
  return (async function () {
    const base64Docs: string[] = [];
    if (formValues[key] && formValues[key].length > 0) {
      const docs = formValues[key];
      for (let i = 0; i < docs.length; i++) {
        const temp = await getBase64(docs[i]?.originFileObj as RcFile);
        base64Docs.push(temp); // No need for Promise.resolve
      }
    }
    return base64Docs;
  })();
};
