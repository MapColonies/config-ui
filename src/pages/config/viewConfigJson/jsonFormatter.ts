export const jsonFormatter = (data: unknown | undefined) => {
  if (!data) {
    return '';
  }
  return JSON.stringify(JSON.parse(JSON.stringify(data)), null, 2);
};
