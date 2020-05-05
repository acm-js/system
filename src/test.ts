import Promise from 'bluebird';
import { Account } from './lib/account';
import { AccountPool, EAccountPoolEventType } from './lib/account-pool';

enum ESystemType {
  CODEFORCES = 'cf',
}

class TimusAccount extends Account {
}

const account1 = new TimusAccount(
  ESystemType.CODEFORCES,
  'iprit',
  '115563',
  'IPRIT'
);

const account2 = new TimusAccount(
  ESystemType.CODEFORCES,
  'iprit2',
  '115563',
  'IPRIT'
);

const pool = new AccountPool([account1, account2, account2, account1]);
pool.on(EAccountPoolEventType.RELEASED, console.log.bind(console, 'released'));
pool.on(EAccountPoolEventType.TAKEN, console.log.bind(console, 'taken'));

setInterval(() => {
  pool.update();
  // @ts-ignore
  console.log(pool.freeSize, pool.roundRobinIndex);
}, 1000);

const accounts: Account[] = [];

function take() {
  accounts.push(pool.take());
}

function release() {
  accounts.pop()?.free();
}

setTimeout(() => {
  take();

  setTimeout(() => {
    take();

    pool.destroy();

    setTimeout(() => {
      release();

      setTimeout(() => {
        release();
      }, 2000);
    }, 3000);
  }, 2000);
}, 3000);
