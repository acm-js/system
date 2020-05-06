import { EventEmitter } from 'events';
import { ENodeEvent, Node } from './node';

export enum ENodeContextEvent {
  FINISHED = 'finished'
}

export class NodeContext extends EventEmitter {
  public destination: Node = new Node(this);

  constructor() {
    super();

    this.destination.on(ENodeEvent.INPUT, result => {
      this.emit(ENodeContextEvent.FINISHED, result);
    });
  }
}
