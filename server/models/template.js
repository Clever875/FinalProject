'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Template extends Model {
    static associate(models) {
      Template.hasMany(models.Question, { foreignKey: 'templateId', as: 'questions', onDelete: 'CASCADE' });
    }
  }
  Template.init({
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    topic: DataTypes.STRING,
    imageUrl: DataTypes.STRING,
    isPublic: DataTypes.BOOLEAN,
    ownerId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Template',
  });
  return Template;
};
