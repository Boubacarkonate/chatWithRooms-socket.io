// Importation de la bibliothèque Mongoose pour interagir avec MongoDB
const mongoose = require('mongoose');

// Définition du schéma 
let roomSchema = new mongoose.Schema({
    name: String,
    _id_message: {
        type: mongoose.Schema.Types.ObjectId, ref: 'chat'
    }
});

// Création et enregistrement d'un modèle 'user' basé sur le schéma 'userSchema'
mongoose.model('room', roomSchema);