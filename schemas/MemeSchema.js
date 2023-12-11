const mongoose = require('mongoose');

const Schema = mongoose.Schema; 

const MemeSchema = new mongoose.Schema({
    templateId: String,
    topText: String,
    bottomText: String,
    imageUrl: String,
    createdAt: { type: Date, default: Date.now }
});

const Meme = mongoose.model('Meme', MemeSchema);

module.exports = Meme;
