const mongoose = require('mongoose');

let userSchema = new mongoose.Schema({
    pseudo: String
    // photo:
    // password:
    // ...
});

mongoose.model('user', userSchema);