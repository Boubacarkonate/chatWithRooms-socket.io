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
    socket.on('pseudo', function (pseudo) {
        socket.pseudo = pseudo;
        socket.broadcast.emit('newUser', pseudo);
    });


//emettre le message à tous les utilisateurs connectés
    socket.on('newMessage', (message) => {
        socket.broadcast.emit('newMessageAll', {message: message, pseudo: socket.pseudo});
    });


    socket.on('writting', (pseudo) => {
        socket.broadcast.emit('writting', pseudo)
    });


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
