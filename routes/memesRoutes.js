const express = require('express');
const app = express();
const port = 3003;
const router = express.Router();
const path = require('path');
const bodyParser = require('body-parser');
const _ = require('lodash');
const axios = require("axios").default;
const fs = require('fs');
const Meme = require('../schemas/MemeSchema');

router.get("/", (req, res) => {
	axios
		.get("https://api.imgflip.com/get_memes")
		.then((memes) => {
			return res.render("memes", {
				memes: _.sampleSize(memes.data.data.memes, 10)
			});
		})
		.catch((e) => {
			return res.status(500).send("500 Internal Server Error");
		});
});

router.post("/generate", (req, res) => {
	axios
		.post(
			"https://api.imgflip.com/caption_image",
			{},
			{
				params: {
					template_id: req.body.template_id,
					username: req.body.username,
					password: req.body.password,
					text0: req.body.text0,
					text1: req.body.text1,
				},
			}
		)
		.then(async (response) => {
			const memeUrl = response.data.data.url;
        	const newMeme = new Meme({
            	templateId: req.body.template_id,
            	topText: req.body.text0,
            	bottomText: req.body.text1,
            	imageUrl: memeUrl
        	});
        	await newMeme.save();
			res.render('memeGenerated', { memeUrl: response.data.data.url });
		}).catch((e) => {
            return res.status(403).send("403 Client Error")
        });
});

router.get('/stored', async (req, res) => {
    try {
        const memes = await Meme.find(); 
        res.render('storedMemes', { memes }); 
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error retrieving stored memes');
    }
});


module.exports = router;