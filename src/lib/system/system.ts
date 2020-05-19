import { EventEmitter } from 'events';

export interface ISystem {
  send: (solution: any) => any;
}

export class System extends EventEmitter implements ISystem {

}
