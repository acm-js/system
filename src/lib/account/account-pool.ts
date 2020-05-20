import {
  bind,
  ETimePeriod,
  freeze, generateKey,
  IDestroyable,
  IKeyable,
  IUpdateable, Key
} from '@acm-js/core';
import { EventEmitter } from 'events';
import { Account, EAccountEvent } from './account';
import { registry } from './account-registry';

export interface IAccountPoolOptions<TSystemType = string> {
  systemType: TSystemType;
  inactivityTimeout?: number;
}

export enum EAccountPoolEvent {
  DESTROYED = 'destroyed',

  ACCOUNT_RELEASED = 'released',
  ACCOUNT_TAKEN = 'taken',
}

export type TPredicate = (account: Account) => boolean;
export const predicates: Record<string, TPredicate> = {
  FREE: (account: Account) => account.isAvailable,
  USING: (account: Account) => !account.isAvailable
};

export class AccountPool<TSystemType = any> extends EventEmitter
  implements IUpdateable, IDestroyable, IKeyable {
  public readonly id: Key = generateKey();
  public readonly type: TSystemType;

  protected accounts: Account[] = [];

  private roundRobinIndex = 0;
  private lastUsedAt: number = Date.now();

  constructor(
    accounts: Account[] = [],
    private readonly options: IAccountPoolOptions<TSystemType> = {
      inactivityTimeout: ETimePeriod.MINUTE * 5,
      systemType: null
    }
  ) {
    super();

    this.type = options.systemType;

    this.add(...accounts);

    // compute and freeze unique key
    // tslint:disable-next-line:no-unused-expression
    this.uniqueKey;
  }

  public update() {
    if (this.isExpired) {
      return this.destroy();
    }

    for (const account of this.accounts) {
      account.update();
    }
  }

  public take(): Account | null {
    this.updateLastUsed();

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

    this.emit(EAccountPoolEvent.DESTROYED);

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

  private updateLastUsed() {
    this.lastUsedAt = Date.now();
  }

  private clear() {
    this.accounts.forEach(account => {
      registry.unregister(account, this);
    });

    this.accounts = [];
  }

  private addAccountListeners(account: Account) {
    account.addListener(EAccountEvent.TAKEN, this.onAccountTaken);
    account.addListener(EAccountEvent.RELEASED, this.onAccountReleased);
  }

  private removeAccountListeners(account: Account) {
    account.removeListener(EAccountEvent.TAKEN, this.onAccountTaken);
    account.removeListener(EAccountEvent.RELEASED, this.onAccountReleased);
  }

  @bind
  private onAccountTaken(account: Account) {
    this.updateLastUsed();

    this.emit(EAccountPoolEvent.ACCOUNT_TAKEN, account);
  }

  @bind
  private onAccountReleased(account: Account) {
    this.updateLastUsed();

    this.emit(EAccountPoolEvent.ACCOUNT_RELEASED, account);
  }

  private get isExpired() {
    return Date.now() - this.lastUsedAt >= this.options.inactivityTimeout;
  }
}
