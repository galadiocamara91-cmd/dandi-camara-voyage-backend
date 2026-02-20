const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Avis = sequelize.define('Avis', {
  id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  note:      { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  commentaire: { type: DataTypes.TEXT, allowNull: false },
  UserId:    { type: DataTypes.INTEGER, allowNull: false },
  VoyageId:  { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'avis', timestamps: true });

module.exports = Avis;