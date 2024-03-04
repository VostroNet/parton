import DataTypes from '../../../types/data-types';
import { IHashDefinition } from '../../utils/field-hash';
import { afterSiteUpdate } from '../logic/site';

const siteDefinition: IHashDefinition = {
  hashFields: {
    doc: 'docHash',
  },
  define: {
    doc: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    docHash: { type: DataTypes.STRING, allowNull: false },
  },
  options: {
    hooks: {
      afterUpdate: [afterSiteUpdate],
    },
  },
};
export default siteDefinition;
