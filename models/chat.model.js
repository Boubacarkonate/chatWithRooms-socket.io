// Importation de la bibliothèque Mongoose pour interagir avec MongoDB
const mongoose = require('mongoose');

// Définition du schéma 
chatSchema = new mongoose.Schema({
    _id_room: {
        type: String
    },
    sender: String,
    receiver: String,
    content: String
});

// Création et enregistrement d'un modèle 'user' basé sur le schéma 'userSchema'
mongoose.model('chat', chatSchema);