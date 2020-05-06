/* tslint:disable:no-console max-classes-per-file */
import Promise from 'bluebird';
import { ENodeEvent, Node } from './lib';
import { Account, AccountPool, EAccountPoolEvent } from './lib/account';
//
// enum ESystemType {
//   CODEFORCES = 'cf'
// }
//
// class TimusAccount extends Account {}
//
// function createAccountPool() {
//   const account1 = new TimusAccount(
//     ESystemType.CODEFORCES,
//     'iprit',
//     '115563',
//     'IPRIT'
//   );
//
//   const account2 = new TimusAccount(
//     ESystemType.CODEFORCES,
//     'iprit2',
//     '115563',
//     'IPRIT'
//   );
//
//   return new AccountPool(
//     [account1, account2, account2, account1],
//     { inactivityTimeout: 5000 }
//   );
// }
//
// const pool = createAccountPool();
//
// pool.on(EAccountPoolEvent.TAKEN, ({ uniqueKey }) =>
//   console.log(`Taken: ${uniqueKey}`)
// );
// pool.on(EAccountPoolEvent.RELEASED, ({ uniqueKey }) =>
//   console.log(`Released: ${uniqueKey}`)
// );
// pool.on(EAccountPoolEvent.DESTROYED, () => {
//   clearInterval(updateInterval);
//   accounts = [];
//   console.log(`Pool "${pool.uniqueKey}" destroyed`);
// });
//
// const updateInterval = setInterval(() => {
//   pool.update();
//   console.log('Free size:', pool.freeSize);
// }, 1000);
//
// let accounts: Account[] = [];
//
// function take() {
//   accounts.push(pool.take());
// }
//
// function release() {
//   accounts.pop()?.free();
// }
//
// setTimeout(() => {
//   take();
//
//   setTimeout(() => {
//     take();
//
//     setTimeout(() => {
//       release();
//
//       setTimeout(() => {
//         release();
//       }, 2000);
//     }, 3000);
//   }, 2000);
// }, 3000);

class IncrementNode extends Node {
  public operation(data: number): number {
    return data + 1;
  }
}

class DecrementNode extends Node {
  public operation(data: number): number {
    return data - 1;
  }
}

class DoubleNode extends Node {
  public operation(data: number): number {
    return data * 2;
  }
}

class HalfNode extends Node {
  public operation(data: number): number {
    return data / 2;
  }
}

const nodeA = new IncrementNode();
const nodeB = new DoubleNode();
const nodeC = new DecrementNode();
const nodeD = new DoubleNode();
const nodeE = new IncrementNode();
const nodeF = new HalfNode();

nodeA.connect(nodeB);
nodeB.connect(nodeC);
nodeC.connect(nodeD);
nodeD.connect(nodeE);
nodeE.connect(nodeF);

nodeA.input(1);

nodeF.on(ENodeEvent.OUTPUT, console.log);
