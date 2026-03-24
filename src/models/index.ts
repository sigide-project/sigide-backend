import { Sequelize } from 'sequelize';
import config from '../db/config';
import initUser, { User } from './User';
import initItem, { Item } from './Item';
import initClaim, { Claim } from './Claim';
import initMessage, { Message } from './Message';
import initReward, { Reward } from './Reward';
import initNotification, { Notification } from './Notification';
import initAddress, { Address } from './Address';
import initSavedItem, { SavedItem } from './SavedItem';
import { DatabaseConfig } from '../types';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env] as DatabaseConfig;

const sequelize = dbConfig.use_env_variable
  ? new Sequelize(process.env[dbConfig.use_env_variable] as string, dbConfig)
  : new Sequelize(
      dbConfig.database as string,
      dbConfig.username as string,
      dbConfig.password,
      dbConfig
    );

initUser(sequelize);
initItem(sequelize);
initClaim(sequelize);
initMessage(sequelize);
initReward(sequelize);
initNotification(sequelize);
initAddress(sequelize);
initSavedItem(sequelize);

// Associations
User.hasMany(Item, { foreignKey: 'user_id', as: 'items' });
Item.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

Item.hasMany(Claim, { foreignKey: 'item_id', as: 'claims' });
Claim.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });

User.hasMany(Claim, { foreignKey: 'claimant_id', as: 'claims' });
Claim.belongsTo(User, { foreignKey: 'claimant_id', as: 'claimant' });

Claim.hasMany(Message, { foreignKey: 'claim_id', as: 'messages' });
Message.belongsTo(Claim, { foreignKey: 'claim_id', as: 'claim' });

User.hasMany(Message, { foreignKey: 'sender_id', as: 'messages' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

Item.hasOne(Reward, { foreignKey: 'item_id', as: 'reward' });
Reward.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Address, { foreignKey: 'user_id', as: 'addresses' });
Address.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// SavedItem associations
User.hasMany(SavedItem, { foreignKey: 'user_id', as: 'savedItems' });
SavedItem.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Item.hasMany(SavedItem, { foreignKey: 'item_id', as: 'savedBy' });
SavedItem.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });

export {
  sequelize,
  Sequelize,
  User,
  Item,
  Claim,
  Message,
  Reward,
  Notification,
  Address,
  SavedItem,
};
