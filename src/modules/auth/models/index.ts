
import { IDefinition } from '../../data/types';
import User from './user';
import UserAuth from './user-auth';
import AuthLog from "./auth-log";

const models: { [key: string]: IDefinition } = {
  User,
  UserAuth,
  AuthLog
};
export default models;
