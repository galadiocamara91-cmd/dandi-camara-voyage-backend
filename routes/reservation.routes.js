const router                 = require('express').Router();
const ctrl                   = require('../controllers/reservation.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.get('/mes-reservations', protect, async (req, res) => {
  try {
    const { Voyage } = require('../models');
    const reservations = await require('../models/Reservation').findAll({
      where: { UserId: req.user.id },
      include: [{ model: Voyage }],
      order: [['createdAt', 'DESC']]
    });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/',                protect,             ctrl.create);
router.get('/mes-reservations', protect,             ctrl.getMes);
router.get('/',                 protect, adminOnly,  ctrl.getAll);
router.put('/:id/statut',       protect, adminOnly,  ctrl.updateStatut);
router.get('/mes-reservations', protect, async (req, res) => {
  try {
    const reservations = await require('../models/Reservation').findAll({
      where: { UserId: req.user.id },
      include: ['Voyage'],
      order: [['createdAt', 'DESC']]
    });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
