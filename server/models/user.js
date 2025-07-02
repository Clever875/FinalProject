const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {}

  User.init({
    name: DataTypes.STRING,
    email: { type: DataTypes.STRING, unique: true },
    passwordHash: DataTypes.STRING,
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
      role: {
        type: DataTypes.STRING,
        defaultValue: 'user',
      },
    }, {
    sequelize,
    modelName: 'User'
  });
  return User;
};
