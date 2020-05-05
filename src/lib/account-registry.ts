import { Registry } from '@acm-js/core';
import { Account } from './account';
import { AccountPool } from './account-pool';

interface RegistryItem {
  item: Account;
  pools: AccountPool[]; // pools where account locates
}

class AccountRegistry extends Registry<Account, RegistryItem> {
  public register(item: Account, target: AccountPool): RegistryItem {
    const registryItem = super.register(item, target);
    const { pools } = registryItem;

    const poolExist = pools.find(pool => pool === target);
    if (!poolExist) {
      pools.push(target);
    }

    return registryItem;
  }

  public wrapRegistryItem(item: Account, pool: AccountPool): RegistryItem {
    return {
      item,
      pools: [pool]
    };
  }

  public unwrapRegistryItem(registryItem: RegistryItem): Account {
    return registryItem.item;
  }

  public unregister(item: Account, target?: AccountPool) {
    const key = item.uniqueKey;
    const { pools } = this.registry.get(key);

    if (target && pools.length > 1) {
      // just delete pool from registry
      const targetIndex = pools.findIndex(pool => pool === target);

      return void pools.splice(targetIndex, 1);
    }

    item?.destroy();

    super.unregister(item);
  }
}

export const registry = new AccountRegistry();
