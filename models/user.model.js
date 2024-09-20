// Importation de la bibliothèque Mongoose pour interagir avec MongoDB
const mongoose = require('mongoose');

// Définition du schéma 
let userSchema = new mongoose.Schema({
    pseudo: String
});

// Création et enregistrement d'un modèle 'user' basé sur le schéma 'userSchema'
mongoose.model('user', userSchema);