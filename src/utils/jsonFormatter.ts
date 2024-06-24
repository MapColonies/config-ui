export const jsonFormatter = (data: unknown | undefined) => {
  return JSON.stringify(data, null, 2);
};
