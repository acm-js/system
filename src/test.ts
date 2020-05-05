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

const pool = new AccountPool();
pool.add(account1, account2, account2, account1);
pool.on(EAccountPoolEventType.RELEASED, console.log);

setInterval(() => {
  pool.update();
  // @ts-ignore
  console.log(pool.freeSize, pool.roundRobinIndex);
}, 1000);

setTimeout(() => {
  let account = pool.take();

  setTimeout(() => {
    account?.free();

    setTimeout(() => {
      account = pool.take();

      setTimeout(() => {
        account?.free();
      }, 2000);
    }, 3000);
  }, 2000);
}, 3000);
