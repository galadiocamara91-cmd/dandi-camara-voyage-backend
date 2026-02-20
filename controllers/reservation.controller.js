const Reservation = require('../models/Reservation');
const Voyage      = require('../models/Voyage');
const User        = require('../models/User');

const create = async (req, res) => {
  try {
    const { voyageId, nbPersonnes, dateDepart, notes } = req.body;
    const voyage = await Voyage.findByPk(voyageId);
    if (!voyage) return res.status(404).json({ message: 'Voyage non trouvé' });
    const montant = voyage.prix * nbPersonnes;
    const reservation = await Reservation.create({
      userId: req.user.id, voyageId, nbPersonnes, montant, dateDepart, notes
    });
    res.status(201).json(reservation);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

const getMes = async (req, res) => {
  try {
    const list = await Reservation.findAll({
      where: { userId: req.user.id },
      include: [{ model: Voyage, attributes: ['titre', 'destination', 'prix'] }]
    });
    res.json(list);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getAll = async (req, res) => {
  try {
    const list = await Reservation.findAll({
      include: [
        { model: User,   attributes: ['nom', 'prenom', 'email'] },
        { model: Voyage, attributes: ['titre', 'destination'] }
      ]
    });
    res.json(list);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateStatut = async (req, res) => {
  try {
    const r = await Reservation.findByPk(req.params.id);
    if (!r) return res.status(404).json({ message: 'Réservation non trouvée' });
    await r.update({ statut: req.body.statut });
    res.json(r);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

module.exports = { create, getMes, getAll, updateStatut };