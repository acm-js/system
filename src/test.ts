/* tslint:disable:no-console max-classes-per-file */
import { delay } from '@acm-js/core';
import { ENodeEvent, Node } from './lib';
import { Account, AccountPool, EAccountPoolEvent } from './lib/account';
import { ENodeContextEvent, NodeContext } from './lib/node/node-context';
import { System } from './lib/system/system';
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
  public operation(data: number): Promise<number> {
    return delay(Math.random() * 1000).then(() => data / 2);
  }
}

const context = new NodeContext();

const nodeA = new IncrementNode(context);
const nodeB = new DoubleNode(context);
const nodeC = new DecrementNode(context);
const nodeD = new DoubleNode(context);
const nodeE = new HalfNode(context);
const nodeF = new HalfNode(context);

nodeA.connect(nodeB);
nodeB.connect(nodeC);
nodeC.connect(nodeD);
nodeD.connect(nodeE);
nodeE.connect(nodeF);
nodeF.connect(context.destination);

nodeA.input(1);

context.on(ENodeContextEvent.FINISHED, console.log);


class TimusSystem extends System {}

/*const system = new TimusSystem();
const context = system.send(solution);
context.on('finish', (verdict) => {});
// когда меняется вердикт (compiling -> testing -> OK)
context.on('verdict-changed', (verdict) => {});
// когда меняется статус проверки (queued -> account)
context.on('status-changed', (verdict) => {});
context.on('error', (error) => {});*/
