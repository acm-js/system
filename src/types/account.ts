import { CookieJar } from 'request';

export interface IAccountMeta {
  jar: CookieJar;
  lastSentMs: number;
}

export interface IAccountOptions {
  timeoutBetween: number;
}
