import moment from "moment";

export function toMoment(unixTimestamp: number) {
  if (!unixTimestamp) {
    return undefined;
  }
  // Check if it's in seconds (10 digits) and convert
  if (String(unixTimestamp).length === 10) {
    return moment.unix(unixTimestamp); // seconds -> moment
  }

  // Assume it's already in milliseconds
  console.log("-----auth-----", unixTimestamp, moment(Number(unixTimestamp)));
  return moment(unixTimestamp); // milliseconds -> moment
}
