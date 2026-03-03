const router                 = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const User                   = require('../models/User');
const { body, validationResult } = require('express-validator');

// ═══════════════════════════════════════
// 📥  TOUS LES UTILISATEURS (admin)
// ═══════════════════════════════════════
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, total: users.length, users });

  } catch (err) {
    console.error('❌ Erreur getAll users :', err.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des utilisateurs' });
  }
});

// ═══════════════════════════════════════
// 📥  UN UTILISATEUR (admin)
// ═══════════════════════════════════════
router.get('/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: '❌ Utilisateur non trouvé' });
    }

    res.json({ success: true, user });

  } catch (err) {
    console.error('❌ Erreur getOne user :', err.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération' });
  }
});

// ═══════════════════════════════════════
// ✏️   MODIFIER LE RÔLE (admin)
// ═══════════════════════════════════════
router.put('/:id/role', protect, adminOnly,
  body('role').isIn(['user', 'admin']).withMessage('Rôle invalide (user ou admin)'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const user = await User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: '❌ Utilisateur non trouvé' });
      }

      // Empêcher de modifier son propre rôle
      if (user.id === req.user.id) {
        return res.status(400).json({ success: false, message: '⚠️ Vous ne pouvez pas modifier votre propre rôle' });
      }

      const ancienRole = user.role;
      await user.update({ role: req.body.role });

      console.log(`✏️  Rôle modifié : ${user.prenom} ${user.nom} → ${ancienRole} → ${req.body.role}`);

      res.json({ success: true, message: `✅ Rôle mis à jour : ${req.body.role}` });

    } catch (err) {
      console.error('❌ Erreur updateRole :', err.message);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ═══════════════════════════════════════
// 🗑️   SUPPRIMER UN UTILISATEUR (admin)
// ═══════════════════════════════════════
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: '❌ Utilisateur non trouvé' });
    }

    // Empêcher de supprimer son propre compte
    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, message: '⚠️ Vous ne pouvez pas supprimer votre propre compte' });
    }

    // Empêcher de supprimer un admin
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: '⚠️ Impossible de supprimer un administrateur' });
    }

    await user.destroy();

    console.log(`🗑️  Utilisateur supprimé : ${user.prenom} ${user.nom} (${user.email})`);

    res.json({ success: true, message: `✅ Utilisateur ${user.prenom} ${user.nom} supprimé` });

  } catch (err) {
    console.error('❌ Erreur deleteUser :', err.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  }
});

module.exports = router;