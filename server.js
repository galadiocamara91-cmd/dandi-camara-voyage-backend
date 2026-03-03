const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
require('dotenv').config();

const { sequelize }      = require('./config/database');
const authRoutes         = require('./routes/auth.routes');
const voyageRoutes       = require('./routes/voyage.routes');
const reservationRoutes  = require('./routes/reservation.routes');
const avisRoutes         = require('./routes/avis.routes');
const userRoutes         = require('./routes/user.routes');

const app = express();

// ═══════════════════════════════════════
// 🛡️  SÉCURITÉ
// ═══════════════════════════════════════
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' } // pour les images /uploads
}));

// Rate limiting global : 100 requêtes / 15 min par IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: '⚠️ Trop de requêtes, réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting strict pour auth : 10 tentatives / 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: '🔒 Trop de tentatives de connexion, réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// ═══════════════════════════════════════
// 📝  LOGS
// ═══════════════════════════════════════
// Format personnalisé avec couleurs et emojis
morgan.token('emoji', (req) => {
  const method = req.method;
  if (method === 'GET')    return '📥';
  if (method === 'POST')   return '📤';
  if (method === 'PUT')    return '✏️ ';
  if (method === 'DELETE') return '🗑️ ';
  return '🔄';
});

morgan.token('status-emoji', (req, res) => {
  const status = res.statusCode;
  if (status < 300) return '✅';
  if (status < 400) return '↩️ ';
  if (status < 500) return '⚠️ ';
  return '❌';
});

const logFormat = ':emoji  :method :url :status-emoji :status - :response-time ms';
app.use(morgan(logFormat));

// ═══════════════════════════════════════
// ⚙️  MIDDLEWARES DE BASE
// ═══════════════════════════════════════
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ═══════════════════════════════════════
// 🛣️  ROUTES
// ═══════════════════════════════════════
app.use('/api/auth',         authLimiter, authRoutes);
app.use('/api/voyages',      voyageRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/avis',         avisRoutes);
app.use('/api/users',        userRoutes);

// Route racine
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '✈️ Dandi Camara Voyage API',
    version: '1.0.0',
    status: '🟢 En ligne',
    endpoints: ['/api/auth', '/api/voyages', '/api/reservations', '/api/avis', '/api/users']
  });
});

// ═══════════════════════════════════════
// ⚠️  GESTION DES ERREURS
// ═══════════════════════════════════════

// Route non trouvée (404)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `❌ Route introuvable : ${req.method} ${req.originalUrl}`
  });
});

// Erreur globale (500)
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur :', err.stack);

  // Erreur de validation Sequelize
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: '⚠️ Données invalides',
      errors: err.errors.map(e => e.message)
    });
  }

  // Erreur de contrainte unique (ex: email déjà utilisé)
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: '⚠️ Cette valeur existe déjà (doublon)',
      errors: err.errors.map(e => e.message)
    });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '🔒 Token invalide'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '🔒 Session expirée, reconnectez-vous'
    });
  }

  // Erreur générique
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '❌ Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ═══════════════════════════════════════
// 🚀  DÉMARRAGE
// ═══════════════════════════════════════
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true })
  .then(() => {
    console.log('');
    console.log('════════════════════════════════════');
    console.log('  ✈️  Dandi Camara Voyage — API');
    console.log('════════════════════════════════════');
    console.log(`  🟢 Serveur    : http://localhost:${PORT}`);
    console.log(`  🗄️  Base BDD   : ✅ Connectée`);
    console.log(`  🛡️  Sécurité   : Helmet + Rate Limit`);
    console.log(`  📝 Logs       : Morgan actif`);
    console.log('════════════════════════════════════');
    console.log('');
    app.listen(PORT, () => {});
  })
  .catch(err => {
    console.error('❌ Erreur de connexion BDD :', err.message);
    process.exit(1);
  });