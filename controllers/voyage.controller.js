const Voyage = require('../models/Voyage');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');

// ═══════════════════════════════════════
// ✅  RÈGLES DE VALIDATION
// ═══════════════════════════════════════
const validateVoyage = [
  body('destination').trim().notEmpty().withMessage('La destination est obligatoire'),
  body('prix').isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  body('places').isInt({ min: 1 }).withMessage('Le nombre de places doit être au moins 1'),
  body('categorie').isIn(['Village', 'Ville']).withMessage('Catégorie invalide (Village ou Ville)'),
];

// ═══════════════════════════════════════
// 📥  TOUS LES VOYAGES
// ═══════════════════════════════════════
const getAll = async (req, res) => {
  try {
    const { categorie, search, promo } = req.query;
    const where = { actif: true };

    if (categorie) where.categorie = categorie;
    if (promo === 'true') where.promo = true;
    if (search) {
      where[Op.or] = [
        { titre:       { [Op.like]: `%${search}%` } },
        { destination: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const voyages = await Voyage.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.json(voyages);
  } catch (err) {
    console.error('❌ Erreur getAll voyages :', err.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des voyages' });
  }
};

// ═══════════════════════════════════════
// 📥  UN SEUL VOYAGE
// ═══════════════════════════════════════
const getOne = async (req, res) => {
  try {
    const voyage = await Voyage.findOne({
      where: { id: req.params.id, actif: true }
    });
    if (!voyage) {
      return res.status(404).json({ success: false, message: '❌ Voyage non trouvé' });
    }
    res.json(voyage);
  } catch (err) {
    console.error('❌ Erreur getOne voyage :', err.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération du voyage' });
  }
};

// ═══════════════════════════════════════
// ➕  CRÉER UN VOYAGE
// ═══════════════════════════════════════
const create = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    // Titre auto si absent
    if (!req.body.titre) req.body.titre = req.body.destination;

    const voyage = await Voyage.create(req.body);

    console.log(`✅ Nouveau voyage créé : ${voyage.destination} (${voyage.prix} MRU)`);

    res.status(201).json({ success: true, message: '✅ Voyage créé avec succès', voyage });

  } catch (err) {
    console.error('❌ Erreur create voyage :', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════
// ✏️   MODIFIER UN VOYAGE
// ═══════════════════════════════════════
const update = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const voyage = await Voyage.findByPk(req.params.id);
    if (!voyage) {
      return res.status(404).json({ success: false, message: '❌ Voyage non trouvé' });
    }

    // Titre auto si destination modifiée
    if (req.body.destination && !req.body.titre) {
      req.body.titre = req.body.destination;
    }

    await voyage.update(req.body);

    console.log(`✏️  Voyage modifié : ${voyage.destination}`);

    res.json({ success: true, message: '✅ Voyage modifié avec succès', voyage });

  } catch (err) {
    console.error('❌ Erreur update voyage :', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════
// 🗑️   SUPPRIMER UN VOYAGE (soft delete)
// ═══════════════════════════════════════
const remove = async (req, res) => {
  try {
    const voyage = await Voyage.findByPk(req.params.id);
    if (!voyage) {
      return res.status(404).json({ success: false, message: '❌ Voyage non trouvé' });
    }

    await voyage.update({ actif: false });

    console.log(`🗑️  Voyage désactivé : ${voyage.destination}`);

    res.json({ success: true, message: '✅ Voyage supprimé avec succès' });

  } catch (err) {
    console.error('❌ Erreur remove voyage :', err.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  }
};

// ═══════════════════════════════════════
// 📊  STATS POUR ADMIN
// ═══════════════════════════════════════
const getStats = async (req, res) => {
  try {
    const total    = await Voyage.count({ where: { actif: true } });
    const promos   = await Voyage.count({ where: { actif: true, promo: true } });
    const villages = await Voyage.count({ where: { actif: true, categorie: 'Village' } });
    const villes   = await Voyage.count({ where: { actif: true, categorie: 'Ville' } });

    res.json({
      success: true,
      stats: { total, promos, villages, villes }
    });
  } catch (err) {
    console.error('❌ Erreur getStats :', err.message);
    res.status(500).json({ success: false, message: 'Erreur stats' });
  }
};

module.exports = { getAll, getOne, create, update, remove, getStats, validateVoyage };