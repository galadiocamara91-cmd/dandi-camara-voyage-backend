const router          = require('express').Router();
const ctrl            = require('../controllers/auth.controller');
const { protect }     = require('../middleware/auth.middleware');

router.put('/change-password', protect, async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const User = require('../models/User');
    const user = await User.findByPk(req.user.id);
    const ok = await bcrypt.compare(req.body.ancienMotDePasse, user.password);
    if (!ok) return res.status(400).json({ message: 'Ancien mot de passe incorrect' });
    user.password = await bcrypt.hash(req.body.nouveauMotDePasse, 10);
    await user.save();
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);
router.get('/me',        protect, ctrl.getMe);

module.exports = router;