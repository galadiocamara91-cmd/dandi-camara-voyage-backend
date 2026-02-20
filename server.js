const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const { sequelize }       = require('./config/database');
const authRoutes          = require('./routes/auth.routes');
const voyageRoutes        = require('./routes/voyage.routes');
const reservationRoutes   = require('./routes/reservation.routes');
const avisRoutes          = require('./routes/avis.routes');
const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth',         authRoutes);
app.use('/api/voyages',      voyageRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/avis', avisRoutes);
app.use('/api/users', require('./routes/user.routes'));
app.get('/', (req, res) => {
  res.json({ message: '✈️ SkyVoyage API fonctionne !' });
});

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true })
  .then(() => {
    console.log('✅ Base de données connectée !');
    app.listen(PORT, () => console.log(`🚀 Serveur sur http://localhost:${PORT}`));
  })
  .catch(err => console.error('❌ Erreur BDD :', err));