import { IDestroyable } from '@acm-js/core';
import { IConnectable } from './connectable';

export interface INode extends IConnectable, IDestroyable {
  // context: INodeContext;
}

export interface INodeContext {
}
