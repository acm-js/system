import { IUpdateable, Key } from '@acm-js/core';
import { Account } from './account';
import {
  AccountPool,
  EAccountPoolEvent,
  IAccountPoolOptions
} from './account-pool';

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

  public getPool(systemType: TSystemType, problemId: number, contestId: number) {
    // layers with priority
    const layers = [
      EAccountPoolLayer.CONTEST,
      EAccountPoolLayer.PROBLEM,
      EAccountPoolLayer.GLOBAL,
    ];

    return layers.map(layer => (
      this.buildKey(systemType, layer, contestId, problemId)
    )).map(key => (
      this.pools.get(key)
    )).find(pool => !!pool?.id)
  }

  public createPool(
    accounts: Account[] = [],
    options: IAccountPoolOptions<TSystemType>,
    layer = EAccountPoolLayer.GLOBAL,
    problemId: number,
    contestId: number,
  ): AccountPool<TSystemType> {
    const pool = new AccountPool<TSystemType>(accounts, options);
    const key = this.buildKey(pool.type, layer, problemId, contestId);

    const existingPool = this.pools.get(key);
    if (existingPool) {
      existingPool.destroy();
    }

    this.pools.set(key, pool);

    pool.on(EAccountPoolEvent.DESTROYED, () => {
      this.pools.delete(key);
    });

    return pool;
  }

  public removePool(
    poolEntity: AccountPool<TSystemType> | Key | TSystemType,
    layer: EAccountPoolLayer = EAccountPoolLayer.GLOBAL,
    problemId: number,
    contestId: number,
  ) {
    let pool: AccountPool<TSystemType>;

    if (poolEntity instanceof AccountPool) {
      // pool already instance
      pool = poolEntity as AccountPool<TSystemType>;
    } else {
      // get pool by key
      const key = this.buildKey(poolEntity as TSystemType, layer, problemId, contestId);
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

  private buildKey(
    systemType: TSystemType,
    layer: EAccountPoolLayer,
    problemId: number,
    contestId: number,
  ): Key {
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
