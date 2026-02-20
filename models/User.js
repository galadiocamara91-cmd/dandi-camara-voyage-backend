const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nom:       { type: DataTypes.STRING, allowNull: false },
  prenom:    { type: DataTypes.STRING, allowNull: false },
  email:     { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password:  { type: DataTypes.STRING, allowNull: false },
  telephone: { type: DataTypes.STRING },
  role:      { type: DataTypes.ENUM('client', 'agent', 'admin'), defaultValue: 'client' }
}, { tableName: 'users', timestamps: true });

module.exports = User;