import { bind, EPeriod, IDestroyable, IUpdateable } from '@acm-js/core';
import { EventEmitter } from 'events';
import { Account, EAccountEventType } from './account';
import { registry } from './account-registry';

export interface IAccountPoolOptions {
  inactivityTimeout?: number;
}

export enum EAccountPoolEventType {
  RELEASED = 'released',
  TAKEN = 'taken',
}

export type TPredicate = (account: Account) => boolean;
export const predicates: Record<string, TPredicate> = {
  FREE: (account: Account) => account.isAvailable,
  USING: (account: Account) => !account.isAvailable,
};

export class AccountPool extends EventEmitter implements IUpdateable, IDestroyable {
  public readonly type: string;

  protected readonly accounts: Account[] = [];

  private roundRobinIndex = 0;

  constructor(
    accounts: Account[] = [],
    private readonly options: IAccountPoolOptions = {
      inactivityTimeout: EPeriod.MINUTE * 5
    }
  ) {
    super();

    this.add(...accounts);
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

      if (account.isAvailable) {
        this.emit(EAccountPoolEventType.TAKEN, account);

        return account.take();
      }
    } while (startIndex !== this.roundRobinIndex);

    return null;
  }

  public add(...accounts: Account[]) {
    const set = new Set([
      ...this.accounts.map(account => account.uniqueKey)
    ]);

    const preparedAccounts = accounts.map(account => (
      registry.register(account)
    )).filter(({ uniqueKey }) => {
      if (set.has(uniqueKey)) {
        return false;
      }
      set.add(uniqueKey);
      return true;
    }).map(account => (
      this.addAccountListeners(account)
    ));

    this.accounts.push(...preparedAccounts);
  }

  public query(predicate: TPredicate): Account[] {
    return this.accounts.filter(predicate);
  }

  public getFreeAccounts() {
    return this.query(predicates.FREE);
  }

  public destroy() {
    this.removeAllListeners();

    this.accounts.forEach(account => (
      this.removeAccountListeners(account)
    ));
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

  private addAccountListeners(account: Account): Account {
    return account.addListener(EAccountEventType.RELEASED, this.onAccountReleased);
  }

  private removeAccountListeners(account: Account): Account {
    return account.removeListener(EAccountEventType.RELEASED, this.onAccountReleased);
  }

  @bind
  private onAccountReleased(account: Account) {
    this.emit(EAccountPoolEventType.RELEASED, account);
  }
}
