const router   = require('express').Router();
const ctrl     = require('../controllers/voyage.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const upload   = require('../middleware/upload.middleware');
const Voyage   = require('../models/Voyage');

// ═══════════════════════════════════════
// 🌍  ROUTES PUBLIQUES
// ═══════════════════════════════════════
router.get('/',          ctrl.getAll);
router.get('/stats',     protect, adminOnly, ctrl.getStats);
router.get('/:id',       ctrl.getOne);

// ═══════════════════════════════════════
// 🔒  ROUTES ADMIN
// ═══════════════════════════════════════
router.post('/',         protect, adminOnly, ctrl.validateVoyage, ctrl.create);
router.put('/:id',       protect, adminOnly, ctrl.validateVoyage, ctrl.update);
router.delete('/:id',    protect, adminOnly, ctrl.remove);

// 🖼️  Upload image
router.post('/:id/image', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '⚠️ Aucun fichier envoyé' });
    }

    const voyage = await Voyage.findByPk(req.params.id);
    if (!voyage) {
      return res.status(404).json({ success: false, message: '❌ Voyage non trouvé' });
    }

    const imagePath = `/uploads/${req.file.filename}`;
    await voyage.update({ image: imagePath });

    console.log(`🖼️  Image uploadée : ${voyage.destination} → ${imagePath}`);

    res.json({ success: true, message: '✅ Image mise à jour', image: imagePath });

  } catch (err) {
    console.error('❌ Erreur upload image :', err.message);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'upload' });
  }
});

module.exports = router;