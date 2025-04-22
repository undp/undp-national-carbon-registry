export function deepCopy(obj: any) {
  // Check if the input is a primitive value or null
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Create a new object or array based on the type of obj
  const copy: any = Array.isArray(obj) ? [] : {};

  // Iterate over the object's keys and copy each value
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      copy[key] = deepCopy(obj[key]); // Recursively copy nested objects
    }
  }

  return copy;
}
