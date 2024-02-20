//ESSSSAIE

// Importation du module Express, qui est un framework web pour Node.js
let express = require('express');

// Initialisation d'une nouvelle instance de l'application Express
let app = express();

// Création d'un serveur HTTP en utilisant le module 'http' de Node.js, en passant l'application Express comme gestionnaire de requêtes
let server = require('http').createServer(app);

// Importation du module Mongoose, qui est un outil de modélisation d'objets MongoDB pour Node.js
const mongoose = require('mongoose');

// Connexion à la base de données MongoDB avec Mongoose
mongoose.connect('mongodb://localhost:27017/ChatSocket')
  .then(() => {
    console.log('*****Connexion à la base de données MongoDB réussie.*******');
    // Placez ici le code à exécuter après la connexion réussie
  })
  .catch((error) => {
    console.error('Erreur lors de la connexion à la base de données MongoDB :', error);
  });

//importation des modèles de données et les schemas
require('./models/chat.model');
require('./models/room.model');
require('./models/user.model')
//définir des variables comportant les modèles de données définis avec Mongoose. Ces modèles sont utilisés pour interagir avec la base de données MongoDB.
let User = mongoose.model('user');
let Room = mongoose.model('room');
let Chat = mongoose.model('chat');

// Utilisation du middleware express.static pour servir les fichiers statiques à partir du répertoire '/public' situé dans le répertoire actuel (__dirname)
// Cela signifie que les fichiers HTML, CSS, JavaScript, etc., contenus dans ce répertoire seront accessibles à partir de l'URL racine de votre serveur (par exemple, http://localhost:8080/)
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
})

// IO
// Importation du module Socket.IO et initialisation de l'écouteur de sockets sur le serveur HTTP
let io = require('socket.io')(server);
let connectedUsers = [];


// Lorsqu'une personne arrive sur la vue index.ejs, la fonction ci-dessous se lance
io.on('connection', (socket) => {
    
  // On recoit 'pseudo' du fichier html
socket.on('pseudo', async (pseudo) => {
    try {
        let user = await User.findOne({ pseudo: pseudo }).exec();
        if (user) {
            // L'utilisateur existe déjà dans la base de données
            // On join automatiquement le channel "salon1" par défaut
            _joinRoom("salon1");

            // On conserve le pseudo dans la variable socket qui est propre à chaque utilisateur
            socket.pseudo = pseudo;
            connectedUsers.push(socket);
            // On previent les autres
            socket.broadcast.to(socket.channel).emit('newUser', pseudo);
        } else {
            // L'utilisateur n'existe pas dans la base de données, on le crée
            let newUser = new User({ pseudo: pseudo });
            await newUser.save();

            // On join automatiquement le channel "salon1" par défaut
            _joinRoom("salon1");

            socket.pseudo = pseudo;
            connectedUsers.push(socket)
            socket.broadcast.to(socket.channel).emit('newUser', pseudo);
            socket.broadcast.emit('newUserInDb', pseudo);
        }
    } catch (error) {
        console.error('Erreur lors de la recherche ou de la sauvegarde de l\'utilisateur :', error);
    }
});


socket.on('oldWhispers', async (pseudo) => {
    try {
        let messages = await Chat.find({ receiver: pseudo }).exec();
        if (messages && messages.length > 0) {
            socket.emit('oldWhispers', messages);
        } else {
            // Aucun message trouvé ou une erreur s'est produite
            console.log('Aucun message trouvé pour', pseudo);
        }
    } catch (error) {
        console.error('Erreur lors de la recherche des anciens chuchotements pour', pseudo, ':', error);
    }
});

    socket.on('changeChannel', (channel) => {
        _joinRoom(channel);
    });

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
    

    // Quand un user se déconnecte
    socket.on('disconnect', () => {
        var index = connectedUsers.indexOf(socket)
        if(index > -1) {
            connectedUsers.splice(index, 1)
        }
        socket.broadcast.to(socket.channel).emit('quitUser', socket.pseudo);
    });

    socket.on('writting', (pseudo) => {
        socket.broadcast.to(socket.channel).emit('writting', pseudo);
    });

    socket.on('notWritting', (pseudo) => {
        socket.broadcast.to(socket.channel).emit('notWritting', pseudo);
    });


    async function _joinRoom(channelParam) {
        try {
            // Si l'utilisateur est déjà dans un canal, stockez-le
            let previousChannel = socket.channel || '';
    
            // Quittez tous les canaux et rejoignez le canal ciblé
            socket.leaveAll();
            socket.join(channelParam);
            socket.channel = channelParam;
    
            let channel = await Room.findOne({ name: socket.channel }).exec();
            if (channel) {
                let messages = await Chat.find({ _id_room: socket.channel }).exec();
                if (!messages) {
                    console.log('Aucun message trouvé pour', socket.pseudo);
                } else {
                    socket.emit('oldMessages', messages, socket.pseudo);
                    // Si l'utilisateur vient d'un autre canal, on le fait passer, sinon on ne fait passer que le nouveau
                    if (previousChannel) {
                        socket.emit('emitChannel', { previousChannel: previousChannel, newChannel: socket.channel });
                    } else {
                        socket.emit('emitChannel', { newChannel: socket.channel });
                    }
                }
            } else {
                let room = new Room({ name: socket.channel });
                await room.save();
                socket.broadcast.emit('newChannel', socket.channel);
                socket.emit('emitChannel', { previousChannel: previousChannel, newChannel: socket.channel });
            }
        } catch (error) {
            console.error('Erreur lors de la recherche ou de la sauvegarde du canal :', error);
        }
    }
    
    

});


//On dit à Node de se lancer sur le port 8080
server.listen(8080, () => console.log('Server started at port : 8080'));