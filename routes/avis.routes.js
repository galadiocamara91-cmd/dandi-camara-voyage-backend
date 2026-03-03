const router                 = require('express').Router();
const ctrl                   = require('../controllers/avis.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

// ═══════════════════════════════════════
// 🌍  ROUTES PUBLIQUES
// ═══════════════════════════════════════
router.get('/voyage/:voyageId',  ctrl.getByVoyage);

// ═══════════════════════════════════════
// 🔒  ROUTES UTILISATEUR CONNECTÉ
// ═══════════════════════════════════════
router.post('/',       protect,            ctrl.validateAvis, ctrl.create);
router.delete('/:id',  protect,            ctrl.remove);

// ═══════════════════════════════════════
// 🔒  ROUTES ADMIN
// ═══════════════════════════════════════
router.get('/',        protect, adminOnly, ctrl.getAll);

module.exports = router;