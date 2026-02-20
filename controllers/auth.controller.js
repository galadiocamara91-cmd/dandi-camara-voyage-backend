const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');

const genToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

const register = async (req, res) => {
  try {
    const { nom, prenom, email, password, telephone } = req.body;
    const existe = await User.findOne({ where: { email } });
    if (existe) return res.status(400).json({ message: 'Email déjà utilisé' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ nom, prenom, email, password: hash, telephone });
    res.status(201).json({
      token: genToken(user.id),
      user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    res.json({
      token: genToken(user.id),
      user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMe = (req, res) => {
  res.json({ id: req.user.id, nom: req.user.nom, prenom: req.user.prenom, email: req.user.email, role: req.user.role });
};

module.exports = { register, login, getMe };