const isProduction = process.env.NODE_ENV === 'production';

export const logInfo = (...args) => {
  if (!isProduction) {
    console.info(...args);
  }
};

export const logWarn = (...args) => {
  if (!isProduction) {
    console.warn(...args);
  }
};

export const logError = (...args) => {
  if (!isProduction) {
    console.error(...args);
  }
};
