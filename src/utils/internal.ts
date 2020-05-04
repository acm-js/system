export const createOverloadError = (fnName: string) => {
  throw new Error(`${fnName} must be overloaded`);
};
