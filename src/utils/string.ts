export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// do you have a better name for this?
export function uncapitalize(str: string) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export function camelToSnakeCase(str: string, separator = '_') {
  return str.replace(
    /[A-Z]/g,
    (letter) => `${separator}${letter.toLowerCase()}`,
  );
}
export function createHexString(id: string | number) {
  return Buffer.from(`${id}`).toString('hex');
}
