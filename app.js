require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const flash = require('express-flash');
const path = require('path');
const methodOverride = require('method-override');
const helmet = require('helmet');
const { globalLimiter } = require('./middleware/rateLimiter');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
}));

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/market-basket';
console.log('Menggunakan MONGODB_URI dari env:', !!process.env.MONGODB_URI);

mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err.message));

require('./config/passport')(passport);

app.use(globalLimiter);

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

const sessionStore = MongoStore.create({
  mongoUrl: mongoUri,
  ttl: 24 * 60 * 60,
  autoRemove: 'native'
});

sessionStore.on('error', (err) => {
  console.error('Session Store Error:', err.message);
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'rahasia123',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  next();
});

app.use('/', require('./routes/indexRoutes'));
app.use('/auth', require('./routes/authRoutes'));
app.use('/mining', require('./routes/miningRoutes'));
app.use('/admin', require('./routes/adminRoutes'));

app.use((err, req, res, next) => {
  console.error('Error:', err);
  req.flash('error', err.message || 'Terjadi kesalahan server');
  res.status(500).redirect('/');
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});