const Reservation = require('../models/Reservation');
const Voyage      = require('../models/Voyage');
const User        = require('../models/User');
const { body, validationResult } = require('express-validator');

// ═══════════════════════════════════════
// ✅  RÈGLES DE VALIDATION
// ═══════════════════════════════════════
const validateReservation = [
  body('voyageId').isInt({ min: 1 }).withMessage('Voyage invalide'),
  body('nbPersonnes').isInt({ min: 1, max: 20 }).withMessage('Nombre de personnes invalide (1-20)'),
  body('dateDepart').isDate().withMessage('Date de départ invalide'),
];

const validateStatut = [
  body('statut').isIn(['en_attente', 'confirmée', 'annulée']).withMessage('Statut invalide'),
];

// ═══════════════════════════════════════
// ➕  CRÉER UNE RÉSERVATION
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

    const { voyageId, nbPersonnes, dateDepart, notes } = req.body;

    // Vérifier que le voyage existe et est actif
    const voyage = await Voyage.findOne({ where: { id: voyageId, actif: true } });
    if (!voyage) {
      return res.status(404).json({ success: false, message: '❌ Voyage non trouvé ou indisponible' });
    }

    // Vérifier que la date est dans le futur
    if (new Date(dateDepart) <= new Date()) {
      return res.status(400).json({ success: false, message: '⚠️ La date de départ doit être dans le futur' });
    }

    // Vérifier les places disponibles
    if (voyage.places < nbPersonnes) {
      return res.status(400).json({
        success: false,
        message: `⚠️ Seulement ${voyage.places} place(s) disponible(s)`
      });
    }

    // Calculer le montant
    const montant = voyage.prix * nbPersonnes;

    const reservation = await Reservation.create({
      userId: req.user.id,
      voyageId,
      nbPersonnes,
      montant,
      dateDepart,
      notes: notes || null,
      statut: 'en_attente'
    });

    // Récupérer avec les associations
    const reservationComplete = await Reservation.findByPk(reservation.id, {
      include: [
        { model: Voyage, attributes: ['titre', 'destination', 'prix', 'image'] },
        { model: User,   attributes: ['nom', 'prenom', 'email'] }
      ]
    });

    console.log(`📋 Nouvelle réservation : ${req.user.prenom} → ${voyage.destination} (${nbPersonnes} pers. · ${montant} MRU)`);

    res.status(201).json({
      success: true,
      message: '✅ Réservation créée avec succès',
      reservation: reservationComplete
    });

  } catch (err) {
    console.error('❌ Erreur create réservation :', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════
// 📥  MES RÉSERVATIONS (utilisateur connecté)
// ═══════════════════════════════════════
const getMes = async (req, res) => {
  try {
    const list = await Reservation.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Voyage,
        attributes: ['titre', 'destination', 'prix', 'image', 'categorie', 'duree']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(list);

  } catch (err) {
    console.error('❌ Erreur getMes :', err.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des réservations' });
  }
};

// ═══════════════════════════════════════
// 📥  TOUTES LES RÉSERVATIONS (admin)
// ═══════════════════════════════════════
const getAll = async (req, res) => {
  try {
    const { statut } = req.query;
    const where = statut ? { statut } : {};

    const list = await Reservation.findAll({
      where,
      include: [
        { model: User,   attributes: ['nom', 'prenom', 'email', 'telephone'] },
        { model: Voyage, attributes: ['titre', 'destination', 'prix', 'image'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Stats rapides
    const stats = {
      total:      list.length,
      enAttente:  list.filter(r => r.statut === 'en_attente').length,
      confirmees: list.filter(r => r.statut === 'confirmée').length,
      annulees:   list.filter(r => r.statut === 'annulée').length,
      montantTotal: list.filter(r => r.statut === 'confirmée').reduce((s, r) => s + parseFloat(r.montant || 0), 0)
    };

    res.json({ success: true, stats, reservations: list });

  } catch (err) {
    console.error('❌ Erreur getAll réservations :', err.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des réservations' });
  }
};

// ═══════════════════════════════════════
// ✏️   MODIFIER LE STATUT (admin)
// ═══════════════════════════════════════
const updateStatut = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const r = await Reservation.findByPk(req.params.id, {
      include: [
        { model: User,   attributes: ['nom', 'prenom'] },
        { model: Voyage, attributes: ['destination'] }
      ]
    });

    if (!r) {
      return res.status(404).json({ success: false, message: '❌ Réservation non trouvée' });
    }

    const ancienStatut = r.statut;
    await r.update({ statut: req.body.statut });

    console.log(`✏️  Réservation #${r.id} : ${ancienStatut} → ${req.body.statut} (${r.Voyage?.destination})`);

    res.json({ success: true, message: `✅ Statut mis à jour : ${req.body.statut}`, reservation: r });

  } catch (err) {
    console.error('❌ Erreur updateStatut :', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════
// 🗑️   ANNULER UNE RÉSERVATION (utilisateur)
// ═══════════════════════════════════════
const annuler = async (req, res) => {
  try {
    const r = await Reservation.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!r) {
      return res.status(404).json({ success: false, message: '❌ Réservation non trouvée' });
    }

    if (r.statut === 'annulée') {
      return res.status(400).json({ success: false, message: '⚠️ Réservation déjà annulée' });
    }

    if (r.statut === 'confirmée') {
      return res.status(400).json({ success: false, message: '⚠️ Impossible d\'annuler une réservation confirmée' });
    }

    await r.update({ statut: 'annulée' });

    console.log(`🗑️  Réservation #${r.id} annulée par l'utilisateur`);

    res.json({ success: true, message: '✅ Réservation annulée avec succès' });

  } catch (err) {
    console.error('❌ Erreur annuler :', err.message);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'annulation' });
  }
};

module.exports = { create, getMes, getAll, updateStatut, annuler, validateReservation, validateStatut };