export interface IConnectable {
  connect(node: IConnectable): this;
  disconnect(node?: IConnectable): this;
}
