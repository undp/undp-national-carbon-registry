export function deepCopy(obj: any) {
  // Check if the input is a primitive value or null
  if (obj === null || typeof obj !== "object") {
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

export function deepCloneWithoutPointerEvents(obj) {
  if (obj instanceof PointerEvent) {
    return undefined;
  }
  if (Array.isArray(obj)) {
    return obj
      .map(deepCloneWithoutPointerEvents)
      .filter((v) => v !== undefined);
  }
  if (obj && typeof obj === "object") {
    const newObj = {};
    for (const key in obj) {
      const value = deepCloneWithoutPointerEvents(obj[key]);
      if (value !== undefined) {
        newObj[key] = value;
      }
    }
    return newObj;
  }
  return obj; // primitives
}


export function safeClone(obj) {
  const seen = new WeakSet();

  function internalClone(value) {
    if (typeof value !== 'object' || value === null) {
      return value; // primitives
    }

    if (seen.has(value)) {
      // Circular reference detected — remove it
      return undefined;
    }
    seen.add(value);

    if (Array.isArray(value)) {
      return value.map(internalClone);
    }

    const newObj = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        newObj[key] = internalClone(value[key]);
      }
    }
    return newObj;
  }

  return internalClone(obj);
}