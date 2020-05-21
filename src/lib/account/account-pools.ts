import { IUpdateable, Key } from '@acm-js/core';
import { Account } from './account';
import {
  AccountPool,
  EAccountPoolEvent,
  IAccountPoolOptions
} from './account-pool';
import { registry } from './account-registry';

export enum EAccountPoolLayer {
  GLOBAL,
  PROBLEM,
  CONTEST,
}

export class AccountPools<TSystemType> implements IUpdateable {
  public static getInstance<TSystemType = string>() {
    return this.instance
      ? this.instance as AccountPools<TSystemType>
      : (this.instance = new AccountPools<TSystemType>());
  }

  private static instance: AccountPools<any>;

  public pools = new Map<Key, AccountPool<TSystemType>>();

  private constructor() {}

  public update() {
    for (const pool of [...this.pools.values()]) {
      pool.update();
    }
  }

  public getPools(): Array<AccountPool<TSystemType>> {
    return [ ...this.pools.values() ];
  }

  public getPool(
    systemType: TSystemType,
    layer: EAccountPoolLayer = EAccountPoolLayer.GLOBAL,
    id?: number
  ) {
    if (layer === EAccountPoolLayer.GLOBAL) {
      return this.pools.get(this.buildKey({ systemType, layer }));
    }

    if (layer === EAccountPoolLayer.PROBLEM) {
      return this.pools.get(this.buildKey({ systemType, layer, problemId: id }));
    }

    if (layer === EAccountPoolLayer.CONTEST) {
      return this.pools.get(this.buildKey({ systemType, layer, contestId: id }));
    }
  }

  public createPool(
    accounts: Account[] = [],
    options: IAccountPoolOptions<TSystemType>,
    layer = EAccountPoolLayer.GLOBAL,
    problemId?: number,
    contestId?: number,
  ): AccountPool<TSystemType> {
    const pool = new AccountPool<TSystemType>(accounts, options);
    const key = this.buildKey({
      contestId,
      layer,
      problemId,
      systemType: pool.type
    });

    const existingPool = this.pools.get(key);
    if (existingPool) {
      existingPool.destroy();
    }

    this.pools.set(key, pool);

    pool.on(EAccountPoolEvent.DESTROYED, () => {
      this.pools.delete(key);
      console.log(registry);
    });

    return pool;
  }

  public removePool(
    poolEntity: AccountPool<TSystemType> | Key | TSystemType,
    layer = EAccountPoolLayer.GLOBAL,
    problemId?: number,
    contestId?: number,
  ) {
    let pool: AccountPool<TSystemType>;

    if (poolEntity instanceof AccountPool) {
      // pool already instance
      pool = poolEntity as AccountPool<TSystemType>;
    } else {
      // get pool by key
      const key = this.buildKey({
        contestId,
        layer,
        problemId,
        systemType: poolEntity as TSystemType
      });

      pool = this.pools.get(key);

      if (!pool) {
        // get pool by id
        for (pool of this.pools.values()) {
          if (poolEntity === pool.id
            || poolEntity === pool.uniqueKey) {
            break;
          }
        }
      }
    }

    pool?.destroy();
  }

  private buildKey(params: {
    systemType: TSystemType,
    layer: EAccountPoolLayer,
    problemId?: number,
    contestId?: number,
  }): Key {
    const {
      systemType, layer,
      problemId, contestId,
    } = params;

    const parts: Array<TSystemType | EAccountPoolLayer | number> = [systemType];

    if (layer === EAccountPoolLayer.PROBLEM) {
      parts.push(layer, problemId);
    }

    if (layer === EAccountPoolLayer.CONTEST) {
      parts.push(layer, contestId);
    }

    return parts.join('-');
  }
}
