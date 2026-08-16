require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || './portfolio.db';

// Email notifications (optional — only set up if credentials are provided)
let mailTransporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
} else {
  console.log('Email notifications disabled — EMAIL_USER/EMAIL_PASS not set in .env');
}

function sendContactNotification({ name, email, message }) {
  if (!mailTransporter) return;

  const notifyTo = process.env.NOTIFY_EMAIL || process.env.EMAIL_USER;

  mailTransporter.sendMail({
    from: `"Portfolio Contact Form" <${process.env.EMAIL_USER}>`,
    to: notifyTo,
    replyTo: email,
    subject: `New portfolio message from ${name}`,
    text: `You got a new message from your portfolio contact form.\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    html: `
      <p>You got a new message from your portfolio contact form.</p>
      <p><strong>Name:</strong> ${name}<br>
      <strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>
    `
  }).catch(err => {
    console.error('Failed to send email notification:', err.message);
  });
}

// Initialize SQLite database
const db = new Database(DB_PATH, { verbose: console.log });

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'new'
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tech TEXT,
    demo_url TEXT,
    github_url TEXT,
    backend_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS experiences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    role TEXT,
    duration TEXT,
    description TEXT,
    tech TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial data (only if empty)
const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
if (projectCount === 0) {
  const insertProject = db.prepare(`
    INSERT INTO projects (slug, title, description, tech, demo_url, github_url, backend_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertProject.run(
    'lms',
    'Brainrot Academy LMS',
    'A complete LMS built with FastAPI and MongoDB — course content, user management and REST APIs, backend and database designed end-to-end.',
    'Python, FastAPI, MongoDB, REST API',
    'https://brainrot-academy-theta.vercel.app',
    'https://github.com/varshaaaparmar',
    'https://brainrot-academy.onrender.com'
  );

  insertProject.run(
    'cards',
    'Product Card Components',
    'A set of production product-card components shipped during internships — reusable, responsive, and wired into React front ends across two live codebases.',
    'React, HTML, CSS, JavaScript',
    null,
    'https://github.com/varshaaaparmar',
    null
  );
}

const expCount = db.prepare('SELECT COUNT(*) as count FROM experiences').get().count;
if (expCount === 0) {
  const insertExp = db.prepare(`
    INSERT INTO experiences (company, role, duration, description, tech)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertExp.run(
    'UptoSkills',
    'Software Developer Intern',
    'Remote · Mar 2026 – Jun 2026',
    JSON.stringify([
      "Enhanced Skillova's UI, improving reliability for 180 users",
      "Built 2 product card components with React & Node.js",
      "Cut reported interface issues by 12% through targeted debugging",
      "Reduced issue turnaround time by 45% with the dev team"
    ]),
    'HTML,CSS,JS,React,Node.js'
  );

  insertExp.run(
    'Apponix Technologies',
    'Frontend Developer Intern',
    'Jan 2026 – Feb 2026',
    JSON.stringify([
      "Built product card UI with HTML, CSS & JavaScript",
      "Delivered front-end features using React & Node.js",
      "Translated 2 design layouts into responsive components"
    ]),
    'HTML,CSS,JS,React,Node.js'
  );
}

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============ API ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    db: 'connected'
  });
});

// Contact form submission
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;

  // Validation
  if (!name || !email || !message) {
    return res.status(400).json({ 
      success: false, 
      error: 'Name, email and message are required' 
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Please provide a valid email address' 
    });
  }

  if (message.length < 10) {
    return res.status(400).json({ 
      success: false, 
      error: 'Message must be at least 10 characters long' 
    });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO contacts (name, email, message) 
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(name.trim(), email.trim(), message.trim());

    // Fire off an email notification — this won't block or fail the response
    sendContactNotification({ name: name.trim(), email: email.trim(), message: message.trim() });

    res.status(201).json({ 
      success: true, 
      message: 'Thank you! Your message has been received. I will get back to you soon.',
      id: result.lastInsertRowid 
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save message. Please try again later.' 
    });
  }
});

// Get all contacts (for admin / portfolio owner)
app.get('/api/contacts', (req, res) => {
  try {
    // Simple auth via query param (for demo)
    const { key } = req.query;
    if (key !== 'varsha2026') {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const stmt = db.prepare(`
      SELECT id, name, email, message, created_at, status 
      FROM contacts 
      ORDER BY created_at DESC
    `);
    const contacts = stmt.all();

    res.json({ 
      success: true, 
      count: contacts.length,
      contacts 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

// Get single contact
app.get('/api/contacts/:id', (req, res) => {
  const { key } = req.query;
  if (key !== 'varsha2026') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const stmt = db.prepare('SELECT * FROM contacts WHERE id = ?');
    const contact = stmt.get(req.params.id);

    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    res.json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch contact' });
  }
});

// Update contact status
app.patch('/api/contacts/:id', (req, res) => {
  const { key } = req.query;
  if (key !== 'varsha2026') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { status } = req.body;
  if (!status || !['new', 'read', 'replied'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  try {
    const stmt = db.prepare('UPDATE contacts SET status = ? WHERE id = ?');
    const result = stmt.run(status, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update contact' });
  }
});

// Delete contact
app.delete('/api/contacts/:id', (req, res) => {
  const { key } = req.query;
  if (key !== 'varsha2026') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const stmt = db.prepare('DELETE FROM contacts WHERE id = ?');
    const result = stmt.run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete contact' });
  }
});

// Get projects
app.get('/api/projects', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM projects ORDER BY created_at DESC');
    const projects = stmt.all();
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch projects' });
  }
});

// Get experiences
app.get('/api/experiences', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM experiences ORDER BY created_at DESC');
    const experiences = stmt.all();
    
    // Parse JSON descriptions
    const parsed = experiences.map(exp => ({
      ...exp,
      description: JSON.parse(exp.description || '[]')
    }));

    res.json({ success: true, experiences: parsed });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch experiences' });
  }
});

// Stats endpoint (for counters on frontend)
app.get('/api/stats', (req, res) => {
  try {
    const contactCount = db.prepare('SELECT COUNT(*) as count FROM contacts').get().count;
    const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
    const expCount = db.prepare('SELECT COUNT(*) as count FROM experiences').get().count;

    res.json({
      success: true,
      stats: {
        messages: contactCount,
        projects: projectCount,
        internships: expCount,
        cgpa: 9.0,
        certificates: 7,
        technologies: 10,
        contributions: 45
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found',
    path: req.path 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Portfolio backend running on http://localhost:${PORT}`);
  console.log(`📁 Database: ${DB_PATH}`);
  console.log(`📬 Contact form endpoint: POST /api/contact`);
  console.log(`🔐 Admin key for protected routes: varsha2026`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nClosing database connection...');
  db.close();
  process.exit(0);
});