const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const multer = require('multer');
const app = express();


const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimeType === 'image/png' || file.mimeType === 'image/jpg' || file.mimeType === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

app.use(bodyParser.json());
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(multer({
    storage: fileStorage,
    fileFilter: fileFilter
}).single('image'));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', "Get, Post, Put, Patch, Delete");
    res.setHeader('Access-Control-Allow-Headers', 'Content-type, Authorization');
    next();
})

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);
app.use((error, req, res, next) => {
    const errorMessage = error.message;
    const status = error.statusCode || 500;
    const data = error.data;
    res.status(status).json({
        message: errorMessage,
        data: data
    });
})

mongoose.connect('mongodb+srv://xyz:123@cluster0.6lk21.mongodb.net/messages?retryWrites=true&w=majority').then(result => {
    app.listen(8080, () => {
        console.log("connected");
    });
}).catch(e => console.log(e));