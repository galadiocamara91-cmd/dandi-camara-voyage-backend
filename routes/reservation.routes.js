const router                 = require('express').Router();
const ctrl                   = require('../controllers/reservation.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

// ═══════════════════════════════════════
// 🔒  ROUTES UTILISATEUR CONNECTÉ
// ═══════════════════════════════════════
router.get('/mes-reservations',  protect,            ctrl.getMes);
router.post('/',                 protect,            ctrl.validateReservation, ctrl.create);
router.put('/:id/annuler',       protect,            ctrl.annuler);

// ═══════════════════════════════════════
// 🔒  ROUTES ADMIN
// ═══════════════════════════════════════
router.get('/',                  protect, adminOnly, ctrl.getAll);
router.put('/:id/statut',        protect, adminOnly, ctrl.validateStatut, ctrl.updateStatut);

module.exports = router;