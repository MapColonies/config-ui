export const jsonFormatter = (data: unknown) => {
  return JSON.stringify(JSON.parse(JSON.stringify(data)), null, 2);
};
