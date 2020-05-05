/* tslint:disable:no-console */
import Promise from 'bluebird';
import { Account } from './lib/account/account';
import { AccountPool, EAccountPoolEventType } from './lib/account/account-pool';

enum ESystemType {
  CODEFORCES = 'cf'
}

class TimusAccount extends Account {}

function createAccountPool() {
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

  return new AccountPool([account1, account2, account2, account1]);
}

const pool = createAccountPool();

pool.on(EAccountPoolEventType.TAKEN, ({ uniqueKey }) =>
  console.log(`Taken: ${uniqueKey}`)
);
pool.on(EAccountPoolEventType.RELEASED, ({ uniqueKey }) =>
  console.log(`Released: ${uniqueKey}`)
);
pool.on(EAccountPoolEventType.DESTROYED, () => {
  clearInterval(updateInterval);
  accounts = [];
  console.log(`Pool "${pool.uniqueKey}" destroyed`);
});

const updateInterval = setInterval(() => {
  pool.update();
  console.log('Free size:', pool.freeSize);
}, 1000);

let accounts: Account[] = [];

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

    // @ts-ignore
    // console.log(registry.registry.get(account1.uniqueKey).pools[0].uniqueKey);

    pool.destroy();

    setTimeout(() => {
      release();

      setTimeout(() => {
        release();
      }, 2000);
    }, 3000);
  }, 2000);
}, 3000);
