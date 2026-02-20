const router             = require('express').Router();
const ctrl               = require('../controllers/voyage.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.post('/:id/image', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const voyage = await require('../models/Voyage').findByPk(req.params.id);
    if (!voyage) return res.status(404).json({ message: 'Voyage non trouvé' });
    await voyage.update({ image: `/uploads/${req.file.filename}` });
    res.json({ image: `/uploads/${req.file.filename}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get('/',     ctrl.getAll);
router.get('/:id',  ctrl.getOne);
router.post('/',    protect, adminOnly, ctrl.create);
router.put('/:id',  protect, adminOnly, ctrl.update);
router.delete('/:id', protect, adminOnly, ctrl.remove);

module.exports = router;