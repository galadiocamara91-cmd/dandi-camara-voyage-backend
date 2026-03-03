const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User   = require('../models/User');

// ═══════════════════════════════════════
// 🔑  GÉNÉRATION TOKEN
// ═══════════════════════════════════════
const genToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Données utilisateur à retourner (sans password)
const userPayload = (user) => ({
  id: user.id,
  nom: user.nom,
  prenom: user.prenom,
  email: user.email,
  role: user.role,
  telephone: user.telephone
});

// ═══════════════════════════════════════
// ✅  RÈGLES DE VALIDATION
// ═══════════════════════════════════════
const validateRegister = [
  body('nom').trim().notEmpty().withMessage('Le nom est obligatoire'),
  body('prenom').trim().notEmpty().withMessage('Le prénom est obligatoire'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe : 6 caractères minimum'),
  body('telephone').optional(),
];

const validateLogin = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe obligatoire'),
];

const validateChangePassword = [
  body('ancienMotDePasse').notEmpty().withMessage('Ancien mot de passe obligatoire'),
  body('nouveauMotDePasse').isLength({ min: 6 }).withMessage('Nouveau mot de passe : 6 caractères minimum'),
];

// ═══════════════════════════════════════
// 📤  INSCRIPTION
// ═══════════════════════════════════════
const register = async (req, res) => {
  try {
    // Vérification des validations
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { nom, prenom, email, password, telephone } = req.body;

    // Email déjà utilisé
    const existe = await User.findOne({ where: { email } });
    if (existe) {
      return res.status(409).json({
        success: false,
        message: '⚠️ Cet email est déjà utilisé'
      });
    }

    // Hashage mot de passe
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ nom, prenom, email, password: hash, telephone });

    console.log(`✅ Nouvel utilisateur : ${prenom} ${nom} (${email})`);

    res.status(201).json({
      success: true,
      message: '✅ Compte créé avec succès',
      token: genToken(user.id),
      user: userPayload(user)
    });

  } catch (err) {
    console.error('❌ Erreur register :', err.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la création du compte' });
  }
};

// ═══════════════════════════════════════
// 🔐  CONNEXION
// ═══════════════════════════════════════
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: '❌ Email ou mot de passe incorrect'
      });
    }

    console.log(`🔐 Connexion : ${user.prenom} ${user.nom} (${user.role})`);

    res.json({
      success: true,
      message: `Bienvenue ${user.prenom} !`,
      token: genToken(user.id),
      user: userPayload(user)
    });

  } catch (err) {
    console.error('❌ Erreur login :', err.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la connexion' });
  }
};

// ═══════════════════════════════════════
// 👤  MON PROFIL
// ═══════════════════════════════════════
const getMe = (req, res) => {
  res.json({
    success: true,
    user: userPayload(req.user)
  });
};

// ═══════════════════════════════════════
// 🔒  CHANGER MOT DE PASSE
// ═══════════════════════════════════════
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { ancienMotDePasse, nouveauMotDePasse } = req.body;
    const user = await User.findByPk(req.user.id);

    // Vérifier ancien mot de passe
    const valide = await bcrypt.compare(ancienMotDePasse, user.password);
    if (!valide) {
      return res.status(401).json({
        success: false,
        message: '❌ Ancien mot de passe incorrect'
      });
    }

    // Même mot de passe ?
    const meme = await bcrypt.compare(nouveauMotDePasse, user.password);
    if (meme) {
      return res.status(400).json({
        success: false,
        message: '⚠️ Le nouveau mot de passe doit être différent de l\'ancien'
      });
    }

    user.password = await bcrypt.hash(nouveauMotDePasse, 12);
    await user.save();

    console.log(`🔒 Mot de passe changé : ${user.prenom} ${user.nom}`);

    res.json({
      success: true,
      message: '✅ Mot de passe modifié avec succès'
    });

  } catch (err) {
    console.error('❌ Erreur changePassword :', err.message);
    res.status(500).json({ success: false, message: 'Erreur lors du changement de mot de passe' });
  }
};

module.exports = {
  register, login, getMe, changePassword,
  validateRegister, validateLogin, validateChangePassword
};