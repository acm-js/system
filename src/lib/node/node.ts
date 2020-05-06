import { generateKey, Key } from '@acm-js/core';
import { EventEmitter } from 'events';
import { INode } from '../../types';
import { NodeContext } from './node-context';

export enum ENodeEvent {
  INPUT = 'input',
  OUTPUT = 'output',
  ERROR = 'error',
}

export class Node extends EventEmitter implements INode<any, any> {
  public readonly uniqueKey = generateKey();

  protected connectedNodes: Map<Key, Node> = new Map();

  constructor(
    public readonly context: NodeContext
  ) {
    super();
  }

  public input(data: any): this {
    this.emit(ENodeEvent.INPUT, data);

    Promise.resolve(this.operation(data)).then(result => {
      this.emit(ENodeEvent.OUTPUT, result);

      for (const node of this.connectedNodes.values()) {
        node.input(result);
      }
    }).catch(error => {
      this.emit(ENodeEvent.ERROR, error);
    });

    return this;
  }

  public operation(data: any): any {
    return data;
  }

  public connect(node: Node): this {
    const key = node.uniqueKey;

    if (this.connectedNodes.has(key)) {
      return;
    }

    this.connectedNodes.set(key, node);

    return this;
  }

  public disconnect(node: Node): this {
    const key = node.uniqueKey;

    if (!this.connectedNodes.has(key)) {
      return;
    }

    this.connectedNodes.delete(key);

    return this;
  }

  public destroy() {
    this.removeAllListeners();
  }
}
