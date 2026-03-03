const Avis   = require('../models/Avis');
const Voyage = require('../models/Voyage');
const User   = require('../models/User');
const { body, validationResult } = require('express-validator');

// ═══════════════════════════════════════
// ✅  RÈGLES DE VALIDATION
// ═══════════════════════════════════════
const validateAvis = [
  body('note').isInt({ min: 1, max: 5 }).withMessage('La note doit être entre 1 et 5'),
  body('commentaire').trim().isLength({ min: 5, max: 500 })
    .withMessage('Le commentaire doit contenir entre 5 et 500 caractères'),
  body('VoyageId').isInt({ min: 1 }).withMessage('Voyage invalide'),
];

// ═══════════════════════════════════════
// ➕  CRÉER UN AVIS
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

    const { note, commentaire, VoyageId } = req.body;

    // Vérifier que le voyage existe
    const voyage = await Voyage.findByPk(VoyageId);
    if (!voyage) {
      return res.status(404).json({ success: false, message: '❌ Voyage non trouvé' });
    }

    // Un seul avis par utilisateur par voyage
    const dejaAvis = await Avis.findOne({
      where: { UserId: req.user.id, VoyageId }
    });
    if (dejaAvis) {
      return res.status(409).json({
        success: false,
        message: '⚠️ Vous avez déjà laissé un avis pour ce voyage'
      });
    }

    const avis = await Avis.create({
      note,
      commentaire,
      VoyageId,
      UserId: req.user.id
    });

    // Retourner avec les infos utilisateur
    const avisComplet = await Avis.findByPk(avis.id, {
      include: [{ model: User, attributes: ['nom', 'prenom'] }]
    });

    console.log(`⭐ Nouvel avis : ${req.user.prenom} → ${voyage.destination} (${note}/5)`);

    res.status(201).json({
      success: true,
      message: '✅ Avis publié avec succès',
      avis: avisComplet
    });

  } catch (err) {
    console.error('❌ Erreur create avis :', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════
// 📥  AVIS D'UN VOYAGE
// ═══════════════════════════════════════
const getByVoyage = async (req, res) => {
  try {
    const avis = await Avis.findAll({
      where: { VoyageId: req.params.voyageId },
      include: [{ model: User, attributes: ['nom', 'prenom'] }],
      order: [['createdAt', 'DESC']]
    });

    const moyenne = avis.length
      ? (avis.reduce((s, a) => s + a.note, 0) / avis.length).toFixed(1)
      : null;

    res.json(avis);

  } catch (err) {
    console.error('❌ Erreur getByVoyage :', err.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des avis' });
  }
};

// ═══════════════════════════════════════
// 📥  TOUS LES AVIS (admin)
// ═══════════════════════════════════════
const getAll = async (req, res) => {
  try {
    const avis = await Avis.findAll({
      include: [
        { model: User,   attributes: ['nom', 'prenom', 'email'] },
        { model: Voyage, attributes: ['titre', 'destination'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, total: avis.length, avis });

  } catch (err) {
    console.error('❌ Erreur getAll avis :', err.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des avis' });
  }
};

// ═══════════════════════════════════════
// 🗑️   SUPPRIMER UN AVIS (admin ou auteur)
// ═══════════════════════════════════════
const remove = async (req, res) => {
  try {
    const avis = await Avis.findByPk(req.params.id);
    if (!avis) {
      return res.status(404).json({ success: false, message: '❌ Avis non trouvé' });
    }

    // Seul l'auteur ou un admin peut supprimer
    if (avis.UserId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '🔒 Non autorisé' });
    }

    await avis.destroy();

    console.log(`🗑️  Avis #${avis.id} supprimé`);

    res.json({ success: true, message: '✅ Avis supprimé avec succès' });

  } catch (err) {
    console.error('❌ Erreur remove avis :', err.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  }
};

module.exports = { create, getByVoyage, getAll, remove, validateAvis };