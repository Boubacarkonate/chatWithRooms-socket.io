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
    res.render('index.ejs');
})

// Middleware pour gérer les requêtes non trouvées (404)
app.use(function (req, res, next) {
    res.setHeader('Content-Type', 'text/html');
    res.status(404).send('ERREUR 404: Page introuvable !');
})

// IO
// Importation du module Socket.IO et initialisation de l'écouteur de sockets sur le serveur HTTP
let io = require('socket.io')(server);
io.on('connection', function (socket) {

//ce code permet au serveur de recevoir le pseudo d'un client, de l'assigner à la propriété pseudo du socket, puis d'informer tous les autres clients de l'arrivée de ce nouvel utilisateur en émettant un événement 'newUser' avec le pseudo correspondant.
socket.on('pseudo', async (pseudo) => {
    try {
        let user = await User.findOne({ pseudo: pseudo }).exec();
        if (user) {
            socket.pseudo = pseudo;
            socket.broadcast.emit('newUser', pseudo);
        } else {
            let newUser = new User({ pseudo: pseudo });
            await newUser.save();
            socket.pseudo = pseudo;
            socket.broadcast.emit('newUser', pseudo);
        }

        let messages = await Chat.find().exec();
        socket.emit('oldMessages', messages);
    } catch (error) {
        console.error('Erreur lors de la recherche ou de la sauvegarde de l\'utilisateur :', error);
    }
});


//emettre le message à tous les utilisateurs connectés
    socket.on('newMessage', (message) => {
        let chatMessage = new Chat();
        chatMessage.content = message;
        chatMessage.sender = socket.pseudo;
        chatMessage.save();

        socket.broadcast.emit('newMessageAll', {message: message, pseudo: socket.pseudo});
    });


// Écouteur d'événement pour indiquer qu'un utilisateur est en train d'écrire
    socket.on('writting', (pseudo) => {
        socket.broadcast.emit('writting', pseudo)
    });


// Écouteur d'événement pour indiquer qu'un utilisateur a cessé d'écrire    
    socket.on('notWritting', () => {
        socket.broadcast.emit('notWritting')
    });



//ce code permet au serveur de détecter lorsque qu'un client se déconnecte et d'informer les autres clients de cette déconnexion en émettant un événement 'quitUser' avec le pseudo de l'utilisateur qui se déconnecte
    socket.on('disconnect', () => {
        socket.broadcast.emit('quitUser', socket.pseudo);
    })
});

// Démarre le serveur HTTP sur le port 8080
server.listen(8080, () => console.log('!!!! server started port: 8080 !!!!'));
