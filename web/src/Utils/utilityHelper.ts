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

function getBase64ImageFromUrl(imageUrl: string) {
  return fetch(imageUrl)
    .then((response) => response.blob())
    .then((blob) => {
      return new Promise<any>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject('Error converting to base64');
        reader.readAsDataURL(blob);
      });
    })
    .catch((err) => {});
}

export const fileUploadValueExtract = async (formValues: any, key: string) => {
  return (async function () {
    const base64Docs: string[] = [];
    if (formValues[key] && formValues[key].length > 0) {
      const docs = formValues[key];
      for (let i = 0; i < docs.length; i++) {
        const temp = docs[i]?.url
          ? docs[i]?.url
          : await getBase64(docs[i]?.originFileObj as RcFile);
        // const temp = await getBase64(docs[i]?.originFileObj as RcFile);
        base64Docs.push(temp); // No need for Promise.resolve
      }
    }
    return base64Docs;
  })();
};

export const extractFilePropertiesFromLink = (link: string) => {
  const fileName = new URL(link).pathname.split('/').pop();
  const extension = link.substring(link.lastIndexOf('.'), link.length);

  return {
    fileName,
    extension,
  };
};

export const formatNumberWithDecimalPlaces = (num: number) => {
  return num % 1 !== 0 ? Number(num.toFixed(2)) : num;
};

export const formatBytes = (bytes: number, decimals = 0) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};
