import Promise from 'bluebird';
import { Account } from './lib/account';
import { AccountPool, EAccountPoolEventType } from './lib/account-pool';

enum ESystemType {
  CODEFORCES = 'cf',
}

class TimusAccount extends Account {
}

const account = new TimusAccount(
  ESystemType.CODEFORCES,
  'iprit',
  '115563',
  'IPRIT'
);

const pool = new AccountPool([account]);
pool.on(EAccountPoolEventType.RELEASED, console.log);

setInterval(() => {
  pool.update();
}, 1000);

setTimeout(() => {
  account.take();

  setTimeout(() => {
    account.free();
  }, 2000);
}, 3000);
