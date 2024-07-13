const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to SQLite database
const db = new sqlite3.Database(':memory:');

// Create users table
db.serialize(() => {
    db.run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT
    )`);
});

// Sign-up route
app.post('/signup', (req, res) => {
    const { email, password } = req.body;
    const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');

    stmt.run(email, password, (err) => {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
                res.status(400).send('Email already exists');
            } else {
                res.status(500).send('Internal server error');
            }
        } else {
            res.status(201).send('User created');
        }
    });

    stmt.finalize();
});

// Login route
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
            res.status(500).send('Internal server error');
        } else if (row && row.password === password) {
            res.status(200).send('Login successful');
        } else {
            res.status(400).send('Incorrect email or password');
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

