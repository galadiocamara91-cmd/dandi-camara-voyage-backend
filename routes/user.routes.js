const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const User = require('../models/User');

router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password'] }, order: [['createdAt', 'DESC']] });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/role', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    await user.update({ role: req.body.role });
    res.json({ message: 'Rôle modifié' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await User.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;