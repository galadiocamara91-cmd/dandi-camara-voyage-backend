const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  register, login, getMe, changePassword,
  validateRegister, validateLogin, validateChangePassword
} = require('../controllers/auth.controller');

router.post('/register',        validateRegister,                    register);
router.post('/login',           validateLogin,                       login);
router.get('/me',               protect,                             getMe);
router.put('/change-password',  protect, validateChangePassword,     changePassword);

module.exports = router;