
import { IDefinition } from '../../data/types';
import User from './user';
import UserAuth from './user-auth';

const models: { [key: string]: IDefinition } = {
  User,
  UserAuth,
};
export default models;
