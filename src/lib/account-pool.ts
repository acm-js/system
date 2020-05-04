import { EPeriod, IUpdateable } from '@acm-js/core';
import { EventEmitter } from 'events';
import { Account, EAccountEventType } from './account';
import { registry } from './account-registry';

export interface IAccountPoolOptions {
  inactivityTimeout?: number;
}

export enum EAccountPoolEventType {
  RELEASED = 'released'
}

export type TPredicate = (account: Account) => boolean;
export const predicates: Record<string, TPredicate> = {
  FREE: (account: Account) => account.isAvailable,
  USING: (account: Account) => !account.isAvailable,
};

export class AccountPool extends EventEmitter implements IUpdateable {
  public readonly type: string;

  protected readonly accounts: Account[] = [];

  constructor(
    accounts: Account[] = [],
    private readonly options: IAccountPoolOptions = {
      inactivityTimeout: EPeriod.MINUTE * 5
    }
  ) {
    super();

    this.add(...accounts);
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
      this.addListeners(account)
    ));

    this.accounts.push(...preparedAccounts);
  }

  public query(predicate: TPredicate): Account[] {
    return this.accounts.filter(predicate);
  }

  public getFreeAccounts() {
    return this.query(predicates.FREE);
  }

  public update() {
    for (const account of this.accounts) {
      account.update();
    }
  }

  public get size() {
    return this.accounts.length;
  }

  public get freeSize() {
    return this.getFreeAccounts().length;
  }

  private addListeners(account: Account): Account {
    return account.on(EAccountEventType.RELEASED, () => {
      this.emit(EAccountPoolEventType.RELEASED, account);
    });
  }
}
