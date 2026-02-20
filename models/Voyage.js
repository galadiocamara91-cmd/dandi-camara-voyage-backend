const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Voyage = sequelize.define('Voyage', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  titre:       { type: DataTypes.STRING, allowNull: false },
  destination: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  prix:        { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  duree:       { type: DataTypes.STRING },
  places:      { type: DataTypes.INTEGER, defaultValue: 10 },
  categorie:   { type: DataTypes.ENUM('Aventure','Plage','Culture','Ville') },
  image:       { type: DataTypes.STRING },
  promo:       { type: DataTypes.BOOLEAN, defaultValue: false },
  actif:       { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'voyages', timestamps: true });

module.exports = Voyage;