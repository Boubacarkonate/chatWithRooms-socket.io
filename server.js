// ESSSSSAIE

// Importation du module Express, un framework web pour Node.js
let express = require('express');

// Initialisation d'une nouvelle instance de l'application Express
let app = express();

// Création d'un serveur HTTP avec l'application Express comme gestionnaire de requêtes
let server = require('http').createServer(app);

// Importation du module Mongoose, un outil de modélisation d'objets MongoDB pour Node.js
const mongoose = require('mongoose');

// Connexion à la base de données MongoDB avec Mongoose
mongoose.connect('mongodb://localhost:27017/ChatSocket')
  .then(() => {
    console.log('*****Connexion à la base de données MongoDB réussie.*******');
    // Code à exécuter après la connexion réussie
  })
  .catch((error) => {
    console.error('Erreur lors de la connexion à la base de données MongoDB :', error);
  });

// Importation des modèles de données et des schémas
require('./models/chat.model');
require('./models/room.model');
require('./models/user.model');

// Définition des variables pour les modèles de données Mongoose
let User = mongoose.model('user');
let Room = mongoose.model('room');
let Chat = mongoose.model('chat');

// Utilisation du middleware express.static pour servir les fichiers statiques du répertoire '/public'
app.use(express.static(__dirname + '/public'));

// ROUTER
// Définition d'une route pour l'URL racine '/' qui rend le fichier 'index.ejs'
app.get('/', function (req, res) {
    User.find()
        .then(users => {
            Room.find()
                .then(rooms => {
                    res.render('index.ejs', { users: users, channels: rooms });
                })
                .catch(err => {
                    console.error('Erreur lors de la recherche des canaux :', err);
                    res.status(500).send('Erreur lors de la recherche des canaux');
                });
        })
        .catch(err => {
            console.error('Erreur lors de la recherche des utilisateurs :', err);
            res.status(500).send('Erreur lors de la recherche des utilisateurs');
        });
});

// Middleware pour gérer les requêtes non trouvées (404)
app.use(function (req, res, next) {
    res.setHeader('Content-Type', 'text/html');
    res.status(404).send('ERREUR 404: Page introuvable !');
});

// IO
// Importation du module Socket.IO et initialisation de l'écouteur de sockets sur le serveur HTTP
let io = require('socket.io')(server);
let connectedUsers = [];

// Lorsqu'un utilisateur se connecte
io.on('connection', (socket) => {
    
    // On reçoit le pseudo du client
    socket.on('pseudo', async (pseudo) => {
        try {
            let user = await User.findOne({ pseudo: pseudo }).exec();
            if (user) {
                // L'utilisateur existe déjà, on le rejoint dans le canal "salon1" par défaut
                _joinRoom("salon1");
                socket.pseudo = pseudo; // Stockage du pseudo dans le socket
                connectedUsers.push(socket); // Ajout de l'utilisateur à la liste des connectés
                socket.broadcast.to(socket.channel).emit('newUser', pseudo); // Notification des autres utilisateurs
            } else {
                // Création d'un nouvel utilisateur
                let newUser = new User({ pseudo: pseudo });
                await newUser.save();
                _joinRoom("salon1"); // Rejoindre le canal par défaut
                socket.pseudo = pseudo;
                connectedUsers.push(socket);
                socket.broadcast.to(socket.channel).emit('newUser', pseudo);
                socket.broadcast.emit('newUserInDb', pseudo); // Notification de l'ajout dans la base de données
            }
        } catch (error) {
            console.error('Erreur lors de la recherche ou de la sauvegarde de l\'utilisateur :', error);
        }
    });

    // Récupération des anciens messages pour un utilisateur
    socket.on('oldWhispers', async (pseudo) => {
        try {
            let messages = await Chat.find({ receiver: pseudo }).exec();
            if (messages && messages.length > 0) {
                socket.emit('oldWhispers', messages); // Envoi des messages à l'utilisateur
            } else {
                console.log('Aucun message trouvé pour', pseudo);
            }
        } catch (error) {
            console.error('Erreur lors de la recherche des anciens chuchotements pour', pseudo, ':', error);
        }
    });

    // Changement de canal
    socket.on('changeChannel', (channel) => {
        _joinRoom(channel);
    });

    // Envoi d'un nouveau message
    socket.on('newMessage', async (message, receiver) => {
        try {
            if (receiver === "all") {
                var chat = new Chat();
                chat._id_room = socket.channel;
                chat.sender = socket.pseudo;
                chat.receiver = receiver;
                chat.content = message;
                await chat.save();
                socket.broadcast.to(socket.channel).emit('newMessageAll', { message: message, pseudo: socket.pseudo });
            } else {
                let user = await User.findOne({ pseudo: receiver }).exec();
                if (!user) {
                    console.log('Utilisateur non trouvé:', receiver);
                    return false;
                }

                let socketReceiver = connectedUsers.find(element => element.pseudo === user.pseudo);
                if (socketReceiver) {
                    socketReceiver.emit('whisper', { sender: socket.pseudo, message: message });
                }

                var chat = new Chat();
                chat.sender = socket.pseudo;
                chat.receiver = receiver;
                chat.content = message;
                await chat.save();
            }
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement du nouveau message:', error);
        }
    });

    // Gestion de la déconnexion d'un utilisateur
    socket.on('disconnect', () => {
        var index = connectedUsers.indexOf(socket);
        if (index > -1) {
            connectedUsers.splice(index, 1);
        }
        socket.broadcast.to(socket.channel).emit('quitUser', socket.pseudo); // Notification des autres utilisateurs
    });

    // Indique que l'utilisateur est en train d'écrire
    socket.on('writting', (pseudo) => {
        socket.broadcast.to(socket.channel).emit('writting', pseudo);
    });

    // Indique que l'utilisateur a cessé d'écrire
    socket.on('notWritting', (pseudo) => {
        socket.broadcast.to(socket.channel).emit('notWritting', pseudo);
    });

    // Fonction pour rejoindre un canal
    async function _joinRoom(channelParam) {
        try {
            let previousChannel = socket.channel || ''; // Sauvegarde du canal précédent
            socket.leaveAll(); // Quitter tous les canaux
            socket.join(channelParam); // Rejoindre le nouveau canal
            socket.channel = channelParam; // Mise à jour du canal

            let channel = await Room.findOne({ name: socket.channel }).exec();
            if (channel) {
                let messages = await Chat.find({ _id_room: socket.channel }).exec();
                if (!messages) {
                    console.log('Aucun message trouvé pour', socket.pseudo);
                } else {
                    socket.emit('oldMessages', messages, socket.pseudo); // Envoi des anciens messages
                    socket.emit('emitChannel', { previousChannel: previousChannel, newChannel: socket.channel }); // Notification du changement de canal
                }
            } else {
                let room = new Room({ name: socket.channel });
                await room.save(); // Création d'un nouveau canal
                socket.broadcast.emit('newChannel', socket.channel); // Notification de la création d'un nouveau canal
                socket.emit('emitChannel', { previousChannel: previousChannel, newChannel: socket.channel });
            }
        } catch (error) {
            console.error('Erreur lors de la recherche ou de la sauvegarde du canal :', error);
        }
    }
});

// Lancement du serveur sur le port 8080
server.listen(8080, () => console.log('Server started at port : 8080'));
