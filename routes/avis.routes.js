const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const Avis = require('../models/Avis');
const User = require('../models/User');

router.get('/voyage/:id', async (req, res) => {
  try {
    const avis = await Avis.findAll({
      where: { VoyageId: req.params.id },
      include: [{ model: User, attributes: ['prenom', 'nom'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(avis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { note, commentaire, VoyageId } = req.body;
    const avis = await Avis.create({ note, commentaire, VoyageId, UserId: req.user.id });
    res.status(201).json(avis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;