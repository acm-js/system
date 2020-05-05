import {
  bind,
  EPeriod,
  freeze,
  IDestroyable,
  IKeyable,
  IUpdateable
} from '@acm-js/core';
import { EventEmitter } from 'events';
import { Account, EAccountEventType } from './account';
import { registry } from './account-registry';

export interface IAccountPoolOptions {
  inactivityTimeout?: number;
}

export enum EAccountPoolEventType {
  RELEASED = 'released',
  TAKEN = 'taken',
  DESTROYED = 'destroyed'
}

export type TPredicate = (account: Account) => boolean;
export const predicates: Record<string, TPredicate> = {
  FREE: (account: Account) => account.isAvailable,
  USING: (account: Account) => !account.isAvailable
};

export class AccountPool extends EventEmitter
  implements IUpdateable, IDestroyable, IKeyable {
  public readonly type: string;

  protected accounts: Account[] = [];

  private roundRobinIndex = 0;

  constructor(
    accounts: Account[] = [],
    private readonly options: IAccountPoolOptions = {
      inactivityTimeout: EPeriod.MINUTE * 5
    }
  ) {
    super();

    this.add(...accounts);

    // compute and freeze unique key
    // tslint:disable-next-line:no-unused-expression
    this.uniqueKey;
  }

  public update() {
    for (const account of this.accounts) {
      account.update();
    }
  }

  public take(): Account | null {
    const startIndex = this.roundRobinIndex;

    do {
      const account = this.accounts[this.roundRobinIndex];
      this.roundRobinIndex = (this.roundRobinIndex + 1) % this.size;

      if (account?.isAvailable) {
        return account.take();
      }
    } while (startIndex !== this.roundRobinIndex);

    return null;
  }

  public query(predicate: TPredicate): Account[] {
    return this.accounts.filter(predicate);
  }

  public getFreeAccounts() {
    return this.query(predicates.FREE);
  }

  public destroy() {
    // clear listeners from accounts only linked with this pool
    this.accounts.forEach(account => this.removeAccountListeners(account));

    this.clear();

    this.emit(EAccountPoolEventType.DESTROYED);

    this.removeAllListeners();
  }

  public get size() {
    return this.accounts.length;
  }

  public get freeSize() {
    return this.getFreeAccounts().length;
  }

  public get hasFree() {
    return this.freeSize > 0;
  }

  @freeze()
  public get uniqueKey() {
    return (
      'pool:' +
      this.accounts
        .map(({ uniqueKey }) => uniqueKey)
        .sort()
        .join(';')
    );
  }

  private add(...accounts: Account[]) {
    const set = new Set([...this.accounts.map(account => account.uniqueKey)]);

    const preparedAccounts = accounts
      .map(account => {
        const registryItem = registry.register(account, this);

        return registry.unwrapRegistryItem(registryItem);
      })
      .filter(({ uniqueKey }) => {
        if (set.has(uniqueKey)) {
          return false;
        }
        set.add(uniqueKey);
        return true;
      })
      .map(account => {
        this.addAccountListeners(account);

        return account;
      });

    this.accounts.push(...preparedAccounts);
  }

  private clear() {
    this.accounts.forEach(account => {
      registry.unregister(account, this);
    });

    this.accounts = [];
  }

  private addAccountListeners(account: Account) {
    account.addListener(EAccountEventType.TAKEN, this.onAccountTaken);
    account.addListener(EAccountEventType.RELEASED, this.onAccountReleased);
  }

  private removeAccountListeners(account: Account) {
    account.removeListener(EAccountEventType.TAKEN, this.onAccountTaken);
    account.removeListener(EAccountEventType.RELEASED, this.onAccountReleased);
  }

  @bind
  private onAccountTaken(account: Account) {
    this.emit(EAccountPoolEventType.TAKEN, account);
  }

  @bind
  private onAccountReleased(account: Account) {
    this.emit(EAccountPoolEventType.RELEASED, account);
  }
}
