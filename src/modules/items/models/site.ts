import DataTypes from '../../../types/data-types';
import { IHashDefinition } from '../../utils/field-hash';
import { afterSiteUpdate } from '../logic/site';

const siteDefinition: IHashDefinition = {

  define: {
    sitePath: { type: DataTypes.STRING, allowNull: false, defaultValue: '/' },
  },
  options: {
    hooks: {
      afterUpdate: [afterSiteUpdate],
    },
  },
};
export default siteDefinition;
