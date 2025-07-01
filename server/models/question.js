'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    static associate(models) {
      Question.belongsTo(models.Template, { foreignKey: 'templateId', as: 'template' });
    }
  }
  Question.init({
    templateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Templates',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: DataTypes.TEXT,
    type: {
      type: DataTypes.ENUM('single-line', 'multi-line', 'integer', 'checkbox'),
      allowNull: false,
    },
    required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    visibleInTable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'Question',
  });
  return Question;
};
