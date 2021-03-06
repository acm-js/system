import {
  freeze,
  IKeyable,
  IUpdateable,
  mixin,
  Requestable
} from '@acm-js/core';
import { EventEmitter } from 'events';
import request, {
  Options as RequestOptions,
  RequestPromise
} from 'request-promise';
import { IAccountMeta, IAccountOptions } from '../../types';
import { createOverloadError } from '../../utils/internal';

export enum EAccountEvent {
  TAKEN = 'taken',
  RELEASED = 'released'
}

interface Account extends Requestable, EventEmitter {}
abstract class Account extends Requestable implements IKeyable, IUpdateable {
  public using: boolean = false;
  public meta: IAccountMeta = {
    jar: request.jar(),
    lastSentMs: 0
  };

  private prevTickAvailable = true;

  public constructor(
    public readonly type: string,
    public readonly login: string,
    public readonly password: string,
    public readonly displayName: string,
    public readonly options: IAccountOptions = {
      timeoutBetween: 0
    }
  ) {
    super();
  }

  public take(): this {
    this.using = true;

    return this;
  }

  public free(): this {
    this.using = false;

    return this;
  }

  public signIn(): Promise<void> {
    return createOverloadError('signIn');
  }

  public logOut() {
    this.meta.jar = request.jar();
  }

  public updateLastSentMs() {
    this.meta.lastSentMs = Date.now();
  }

  public request<T = any>(options: RequestOptions): RequestPromise<T> {
    options.jar = this.meta.jar;

    return super.request(options);
  }

  public isAuth(): Promise<boolean> {
    return createOverloadError('isAuth');
  }

  public update() {
    const curTickAvailable = this.isAvailable;

    if (this.prevTickAvailable === curTickAvailable) {
      return;
    }

    const eventType = this.prevTickAvailable
      ? EAccountEvent.TAKEN
      : EAccountEvent.RELEASED;

    this.emit(eventType, this);

    this.prevTickAvailable = curTickAvailable;
  }

  public reset(): void {
    this.cancelAllRequests();

    this.meta.lastSentMs = 0;
    this.meta.jar = request.jar();

    this.using = false;
  }

  public destroy() {
    this.removeAllListeners();

    super.destroy();
  }

  public get isAvailable(): boolean {
    return (
      !this.using &&
      Date.now() - this.meta.lastSentMs > this.options.timeoutBetween
    );
  }

  @freeze()
  public get uniqueKey() {
    return `${this.type}:${this.login}`;
  }
}

mixin(Account, [EventEmitter]);

export { Account };
