import { IDestroyable, IKeyable } from '@acm-js/core';
import { IConnectable } from './connectable';

export interface INode<TInput = any, TOutput = any> extends IConnectable, IDestroyable, IKeyable {
  input(data: TInput): this;
  operation(data: TInput): TOutput | Promise<TOutput>;
}
