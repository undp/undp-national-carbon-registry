import moment from "moment";

export function toMoment(unixTimestamp: number) {
  // Check if it's in seconds (10 digits) and convert
  if (String(unixTimestamp).length === 10) {
    return moment.unix(unixTimestamp); // seconds -> moment
  }

  // Assume it's already in milliseconds
  return moment(unixTimestamp); // milliseconds -> moment
}
