import { EventEmitter } from 'events';
import { INode } from '../types';

export class Node extends EventEmitter implements INode {
  public connect(node: INode): this {
    return this;
  }

  public disconnect(node: INode): this {
    return this;
  }

  public destroy(): void {
    return;
  }
}
