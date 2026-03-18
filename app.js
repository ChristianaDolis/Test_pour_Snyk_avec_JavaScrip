const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const _ = require('lodash');

const app = express();
const db = new sqlite3.Database(':memory:'); // Base de données temporaire en mémoire

app.use(bodyParser.urlencoded({ extended: true }));

// Initialisation d'une table utilisateur
db.serialize(() => {
    db.run("CREATE TABLE users (id INT, name TEXT, password TEXT)");
    db.run("INSERT INTO users VALUES (1, 'Admin', 'P@ssword123')");
});

// --- VULNÉRABILITÉ 1 : Injection SQL (CWE-89) ---
app.get('/search-user', (req, res) => {
    const userId = req.query.id;
    // MAUVAISE PRATIQUE : Concaténation directe de l'entrée utilisateur
    const query = "SELECT name FROM users WHERE id = " + userId;

    db.get(query, (err, row) => {
        if (err) {
            res.status(500).send("Erreur SQL : " + err.message);
        } else {
            res.send("Utilisateur trouvé : " + JSON.stringify(row));
        }
    });
});

// --- VULNÉRABILITÉ 2 : Cross-Site Scripting / XSS (CWE-79) ---
app.get('/welcome', (req, res) => {
    const name = req.query.name;
    // MAUVAISE PRATIQUE : L'entrée n'est pas nettoyée avant d'être envoyée au navigateur
    res.send("<h1>Bienvenue " + name + " !</h1>");
});

// --- VULNÉRABILITÉ 3 : Prototype Pollution (CWE-1321) ---
app.post('/update-profile', (req, res) => {
    let userProfile = { role: 'user' };
    const newData = JSON.parse(req.body.data);

    // Utilisation de lodash.merge (version vulnérable)
    _.merge(userProfile, newData);

    res.send("Profil mis à jour");
});

app.listen(3000, () => {
    console.log('Serveur de test lancé sur http://localhost:3000');
});