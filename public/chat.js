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

// Mise à jour du titre du document pour inclure le pseudo choisi
document.title = pseudo + ' - ' + document.title;


document.getElementById('chatForm').addEventListener('submit', (e) => {

    e.preventDefault();
console.log('formulaire ok');

    const textInput = document.getElementById('msgInput').value;
    document.getElementById('msgInput').value = '';

    if (textInput.length > 0) {
        socket.emit('newMessage', textInput);
        createElementFunction('newMessageMe', textInput);
        console.log('message envoyé');
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
socket.on('newUser', (pseudo) => {

        createElementFunction('newUser', pseudo);
});


socket.on('newMessageAll', (content) => {

    createElementFunction('newMessageAll', content);
});


socket.on('writting', (pseudo) => {
    document.getElementById('isWritting').textContent = pseudo + " est en train d'écrire";
});


socket.on('notWritting', () => {
    document.getElementById('isWritting').textContent = '';
});


socket.on('quitUser', (pseudo) => {

    createElementFunction('quitUser', pseudo);
})


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

        case 'quitUser':
                newElement.classList.add(element, 'message')
                newElement.textContent = content + ' a quitté le chat';
                document.getElementById('msgContainer').appendChild(newElement);
    
        default:
            break;
    }
}