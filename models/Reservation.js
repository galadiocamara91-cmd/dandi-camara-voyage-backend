const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User   = require('./User');
const Voyage = require('./Voyage');

const Reservation = sequelize.define('Reservation', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nbPersonnes: { type: DataTypes.INTEGER, defaultValue: 1 },
  montant:     { type: DataTypes.DECIMAL(10, 2) },
  dateDepart:  { type: DataTypes.DATEONLY },
  statut:      { type: DataTypes.ENUM('en_attente','confirmée','annulée'), defaultValue: 'en_attente' },
  notes:       { type: DataTypes.TEXT }
}, { tableName: 'reservations', timestamps: true });

User.hasMany(Reservation,    { foreignKey: 'userId' });
Reservation.belongsTo(User,  { foreignKey: 'userId' });
Voyage.hasMany(Reservation,  { foreignKey: 'voyageId' });
Reservation.belongsTo(Voyage,{ foreignKey: 'voyageId' });

module.exports = Reservation;