import { FormInstance } from "antd";
import moment from "moment";

export const disableYears = (currentDate: any, form: FormInstance, key: string) => {
  const vintageMap = {}
  const vintage = form.getFieldValue("vintage");

  let disableYears = false;

  if (vintage) {
    const vintageYear = moment(vintage).year()
    vintageMap[vintageYear] = true
  }
  
  form.getFieldValue(key)?.forEach((reduction: any) => {
    const tempVintage = reduction?.vintage;
    if (tempVintage) {
      const tempVintageYear = moment(tempVintage).year();
      vintageMap[tempVintageYear] = true
    }
  });

  console.log("vintageMap", vintageMap);

  if (vintageMap[currentDate?.year()]) {
    disableYears = true
  }

  if (currentDate > moment().endOf('year')) {
    disableYears = true
  }
  return disableYears
};
