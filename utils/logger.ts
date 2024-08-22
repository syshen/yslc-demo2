import pino from 'pino';
import { logflarePinoVercel } from 'pino-logflare';

enum LogAction {
  ADD_CUSTOMER = 'ADD_CUSTOMER',
  IMPORT_CUSTOMERS = 'IMPORT_CUSTOMERS',
  MODIFY_CUSTOMER = 'MODIFY_CUSTOMER',
  DELETE_CUSTOMERS = 'DELETE_CUSTOMERS',
  ADD_PRODUCT = 'ADD_PRODUCT',
  IMPORT_PRODUCTS = 'IMPORT_PRODUCTS',
  MODIFY_PRODUCT = 'MODIFY_PRODUCT',
  DELETE_PRODUCTS = 'DELETE_PRODUCTS',
  CHANGE_STATUS = 'CHANGE_STATUS',
  SEND_MESSAGE = 'SEND_MESSAGE',
  EXPORT_ORDERS = 'EXPORT_ORDERS',
  VIEW_PAGE = 'VIEW_PAGE',
}

// https://docs.react2025.com/logging#installing--using-pino-logflare
const { stream, send } = logflarePinoVercel({
  apiKey: process.env.NEXT_PUBLIC_LOGFLARE_KEY || '',
  sourceToken: process.env.NEXT_PUBLIC_LOGFLARE_STREAM || '',
});

const logger = pino({
  browser: {
      transmit: {
          level: 'info',
          send,
      },
  },
  level: 'debug',
  base: {
      env: process.env.NODE_ENV || 'development',
      revision: process.env.VERCEL_GITHUB_COMMIT_SHA,
  },
}, stream);

const formatObjectKeys = (headers: Record<string, string>) => {
  const keyValues: Record<string, any> = {};

  Object.keys(headers).map((key) => {
    const newKey = key.replace(/-/g, '_');
    keyValues[newKey] = headers[key];
    return newKey;
  });

  return keyValues;
};

export { logger, formatObjectKeys, LogAction };
