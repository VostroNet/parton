import Sequelize, {
  Attributes,
  CountWithOptions,
  CreateOptions,
  CreationAttributes,
  ModelStatic,
} from 'sequelize';
// import {
//   FindOptions as SFindOptions,
//   Transaction,
//   WhereOptions,
// } from 'sequelize';

export class Model<
  T1 extends NonNullable<unknown>,
  T2 extends NonNullable<unknown>,
> extends Sequelize.Model<T1, T2> {
  public static create<
    M extends Sequelize.Model,
    O extends CreateOptions<Attributes<M>> = CreateOptions<Attributes<M>>,
  >(
    this: ModelStatic<M>,
    values?: CreationAttributes<M>,
    options?: O,
  ): Promise<
    O extends { returning: false } | { ignoreDuplicates: true } ? any : M
  >;

  public static count<M extends Sequelize.Model>(
    this: ModelStatic<M>,
    options: CountWithOptions<Attributes<M>>,
  ): Promise<any>;
  //The 'this' context of type 'typeof ProductGroup' is not assignable to method's 'this' of type 'ModelStatic<ProductGroup>'.ts
  // public static count<M extends Model>(
  //   this: any,
  //   options?: CountOptions<Attributes<M>>
  // ): Promise<number>;
}
// export interface DbOptions extends FindOptions {}
