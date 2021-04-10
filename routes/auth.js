const express = require('express');
const User = require('../models/user');

const authController = require('../controllers/auth');
const {
    body
} = require('express-validator');

const router = express.Router();

router.put('/signup', [
    body('name').trim().isLength({
        min: 5
    }).not().isEmpty(),
    body('email')
    .isEmail()
    .withMessage('Email is invalid')
    .custom((value, {
        req
    }) => {
        return User.findOne({
            email: value
        }).then(userDoc => {
            if (userDoc) {
                return Promise.reject('Email already exists');
            }
        })
    })
    .normalizeEmail(),
    body('password').trim().isLength({
        min: 5
    })
], authController.signUp);

router.post('/login', authController.login);

module.exports = router;