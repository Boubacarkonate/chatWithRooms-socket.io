// Importation du module Express, qui est un framework web pour Node.js
let express = require('express');

// Initialisation d'une nouvelle instance de l'application Express
let app = express();

// Création d'un serveur HTTP en utilisant le module 'http' de Node.js, en passant l'application Express comme gestionnaire de requêtes
let server = require('http').createServer(app);

// Importation du module Mongoose, qui est un outil de modélisation d'objets MongoDB pour Node.js
let mongoose = require('mongoose');

// Utilisation du middleware express.static pour servir les fichiers statiques à partir du répertoire '/public' situé dans le répertoire actuel (__dirname)
// Cela signifie que les fichiers HTML, CSS, JavaScript, etc., contenus dans ce répertoire seront accessibles à partir de l'URL racine de votre serveur (par exemple, http://localhost:8080/)
app.use(express.static(__dirname + '/public'));

// Démarre le serveur HTTP sur le port 8080
server.listen(8080, () => console.log('!!!! server started port: 8080 !!!!'));
