// Connexion au serveur Socket.IO
let socket = io.connect('http://localhost:8080');

let pseudo; // Déclaration de la variable qui stockera le pseudo de l'utilisateur

// Utilisation d'une boucle do...while pour demander le pseudo à l'utilisateur
do {
    pseudo = prompt('Quel est ton nom ?'); // Demande à l'utilisateur de saisir un pseudo
} while (!pseudo); // La boucle continue jusqu'à ce que l'utilisateur saisisse un pseudo valide

console.log('Pseudo choisi :', pseudo); // Affichage du pseudo choisi dans la console

// Envoi du pseudo au serveur via Socket.IO
socket.emit('pseudo', pseudo);

socket.emit('oldWhispers', pseudo);

// Mise à jour du titre du document pour inclure le pseudo choisi
document.title = pseudo + ' - ' + document.title;


document.getElementById('chatForm').addEventListener('submit', (e) => {

    e.preventDefault();
console.log('formulaire ok');

    const textInput = document.getElementById('msgInput').value;
    document.getElementById('msgInput').value = '';

    const receiver = document.getElementById('receiverInput').value;

    if (textInput.length > 0) {
        socket.emit('newMessage', textInput, receiver);
        if (receiver === 'all') {
            createElementFunction('newMessageMe', textInput);
            console.log('message envoyé');
        }
        
    } else {
        return false;
    }
});



                            //Ecouteur d'événement

/*
Lorsqu'un nouvel utilisateur rejoint le chat, cet événement est écouté côté client. Lorsque cet 
événement est reçu, la fonction createElementFunction est appelée pour créer un élément HTML représentant l'arrivée 
de ce nouvel utilisateur.
*/



// Écouteur d'événement pour l'arrivée d'un nouvel utilisateur déclenché lorsque le serveur émet l'événement 'newUser' avec le pseudo de nouvel utilisateur.
socket.on('newUser', (pseudo) => {
    // Lorsqu'un nouvel utilisateur rejoint le chat, cette fonction est appelée
    // Elle crée un nouvel élément HTML pour afficher l'arrivée de ce nouvel utilisateur
    createElementFunction('newUser', pseudo);
});


socket.on('newUserInDb', (pseudo) => {
    newOptions = document.createElement('option');
    newOptions.textContent = pseudo;
    newOptions.value = pseudo;
    document.getElementById('receiverInput').appendChild(newOptions);
});


socket.on('oldWhispers', (messages) => {
    messages.forEach((message) => {
        createElementFunction('oldWhispers', message);
    });
})

// Écouteur d'événement pour la réception d'un nouveau message déclenché lorsque le serveur émet l'événement 'newMessageAll' avec le contenu du message.
socket.on('newMessageAll', (content) => {
    // Lorsqu'un nouveau message est reçu, cette fonction est appelée
    // Elle crée un nouvel élément HTML pour afficher le message dans l'interface utilisateur
    createElementFunction('newMessageAll', content);
});

socket.on('whisper', (content) => {
    createElementFunction('whisper', content);
});


socket.on('oldMessages', (messages) => {
    messages.forEach(message => {
        if (message.sender === pseudo) {
            createElementFunction('oldMessagesMe', message); // Ajout d'une virgule entre 'oldMessagesMe' et msg
            console.log('message visible');
        } else {
            createElementFunction('oldMessages', message); // Ajout d'une virgule entre 'oldMessages' et msg
            console.log('msg non visible');
        }
    });
});

// Écouteur d'événement déclenché lorsque le serveur émet l'événement 'writting' avec le pseudo de l'utilisateur qui est en train d'écrire.
socket.on('writting', (pseudo) => {
    // Lorsque le serveur émet l'événement 'writting', cette fonction est appelée
    // Elle met à jour l'élément HTML avec l'ID 'isWritting' pour afficher que l'utilisateur est en train d'écrire
    document.getElementById('isWritting').textContent = pseudo + " est en train d'écrire";
});

// Écouteur d'événement pour indiquer qu'un utilisateur a cessé d'écrire. Il est déclenché lorsque le serveur émet l'événement 'notWritting'.
socket.on('notWritting', () => {
    // Lorsque le serveur émet l'événement 'notWritting', cette fonction est appelée
    // Elle efface le texte indiquant que l'utilisateur est en train d'écrire de l'élément HTML avec l'ID 'isWritting'
    document.getElementById('isWritting').textContent = '';
});

// Écouteur d'événement déclenché lorsque le serveur émet l'événement 'quitUser' avec le pseudo de l'utilisateur qui quitte le chat.
socket.on('quitUser', (pseudo) => {
    // Lorsqu'un utilisateur quitte le chat, cette fonction est appelée
    // Elle crée un nouvel élément HTML pour afficher le départ de cet utilisateur dans l'interface utilisateur
    createElementFunction('quitUser', pseudo);
});


                            //funtion

/*
Cette fonction crée un nouvel élément HTML en fonction de l'élément passé en paramètre. Dans ce cas, elle crée un 
message indiquant qu'un nouvel utilisateur a rejoint le chat. Cet élément est ensuite ajouté à un conteneur dans 
l'interface utilisateur.
*/ 

function writting() {
    socket.emit('writting', pseudo);
}

function notWritting() {
    socket.emit('notWritting');
}


function createElementFunction(element, content){

    const newElement = document.createElement('div');

    switch (element) {
        case 'newUser':
                newElement.classList.add(element, 'message')
                newElement.textContent = content + ' a rejoint le chat';
                document.getElementById('msgContainer').appendChild(newElement);
            break;

        case 'newMessageMe':
                newElement.classList.add(element, 'message')
                newElement.innerHTML = pseudo + ' : ' + content;
                document.getElementById('msgContainer').appendChild(newElement);
            break;

        case 'newMessageAll':
                newElement.classList.add(element, 'message')
                newElement.innerHTML = content.pseudo + ' : ' + content.message;
                document.getElementById('msgContainer').appendChild(newElement);
            break;

        case 'whisper':
                newElement.classList.add(element, 'message')
                newElement.innerHTML = content.sender + ' vous a chuchoté : ' + content.message;
                document.getElementById('msgContainer').appendChild(newElement);
            break;

        case 'oldMessages':
                newElement.classList.add(element, 'message');
                newElement.innerHTML = content.sender + ': ' + content.content;
                document.getElementById('msgContainer').appendChild(newElement);
            break;

            case 'oldMessagesMe':
                newElement.classList.add('newMessageMe', 'message');
                newElement.innerHTML = content.sender + ': ' + content.content;
                document.getElementById('msgContainer').appendChild(newElement);
            break;

        case 'oldWhispers':
                newElement.classList.add(element, 'message');
                newElement.innerHTML = content.sender + ' vous a chuchoté : ' + content.content;
                document.getElementById('msgContainer').appendChild(newElement);
            break;

        case 'quitUser':
                newElement.classList.add(element, 'message')
                newElement.textContent = content + ' a quitté le chat';
                document.getElementById('msgContainer').appendChild(newElement);
    
        default:
            break;
    }
}