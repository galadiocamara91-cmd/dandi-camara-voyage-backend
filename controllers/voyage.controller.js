const Voyage  = require('../models/Voyage');
const { Op }  = require('sequelize');

const getAll = async (req, res) => {
  try {
    const { categorie, search } = req.query;
    const where = { actif: true };
    if (categorie) where.categorie = categorie;
    if (search) where.titre = { [Op.like]: `%${search}%` };
    const voyages = await Voyage.findAll({ where });
    res.json(voyages);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getOne = async (req, res) => {
  try {
    const voyage = await Voyage.findByPk(req.params.id);
    if (!voyage) return res.status(404).json({ message: 'Voyage non trouvé' });
    res.json(voyage);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const create = async (req, res) => {
  try {
    const voyage = await Voyage.create(req.body);
    res.status(201).json(voyage);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

const update = async (req, res) => {
  try {
    const voyage = await Voyage.findByPk(req.params.id);
    if (!voyage) return res.status(404).json({ message: 'Voyage non trouvé' });
    await voyage.update(req.body);
    res.json(voyage);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

const remove = async (req, res) => {
  try {
    const voyage = await Voyage.findByPk(req.params.id);
    if (!voyage) return res.status(404).json({ message: 'Voyage non trouvé' });
    await voyage.update({ actif: false });
    res.json({ message: 'Voyage supprimé' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getAll, getOne, create, update, remove };