const express = require('express');
const morgan = require('morgan');
const path = require('path');

const profile = require('./data/profile');
const projects = require('./data/projects');
const { saveContact } = require('./sheets');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Hide request logs while tests run
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Reads form submissions (url-encoded) into req.body
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Makes these available in every template (header, nav, footer)
app.locals.profile = profile;

// The function that sends contact info somewhere. Tests swap in a fake one.
app.locals.saveContact = saveContact;

// ---------------- Routes ----------------

app.get('/', (req, res) => {
  res.render('index', { page: 'home', featured: projects.slice(0, 3) });
});

app.get('/portfolio', (req, res) => {
  res.render('portfolio', { page: 'portfolio', projects });
});

app.get('/contact', (req, res) => {
  res.render('contact', { page: 'contact', contact: {}, error: null });
});

app.post('/thanks', async (req, res) => {
  const contact = {
    firstName: (req.body.firstName || '').trim(),
    lastName: (req.body.lastName || '').trim(),
    email: (req.body.email || '').trim(),
    message: (req.body.message || '').trim().slice(0, 1000),
  };

  // Keep the user on the form if something is missing
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email);
  if (!contact.firstName || !contact.lastName || !emailLooksValid) {
    return res.status(400).render('contact', {
      page: 'contact',
      contact,
      error: 'Please enter your first name, last name, and a valid email.',
    });
  }

  try {
    await app.locals.saveContact(contact);
    res.render('thanks', { page: 'contact', contact });
  } catch (err) {
    console.error('Could not save contact:', err.message);
    res.status(500).render('contact', {
      page: 'contact',
      contact,
      error: "Sorry, your message didn't go through. Please try again in a minute.",
    });
  }
});

// Anything else is a 404
app.use((req, res) => {
  res.status(404).render('404', { page: '' });
});

// Only start listening when run directly (not when tests import the app)
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Portfolio running at http://localhost:${port}`));
}

module.exports = app;
