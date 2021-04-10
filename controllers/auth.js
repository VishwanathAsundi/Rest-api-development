const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const {
    validationResult
} = require('express-validator');

exports.signUp = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let error = new Error('Validation failed');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    bcrypt.hash(password, 12).then(hashedPw => {
            let user = new User({
                name: name,
                email: email,
                password: hashedPw
            });
            return user.save();
        }).then(user => {
            res.status(201).json({
                message: 'A new user created',
                userId: user._id
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })

};

exports.login = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let error = new Error('Validation failed');
        error.statusCode = 422;
        throw error;
    }
    const email = req.body.email;
    const password = req.body.password;
    let userData;
    User.findOne({
            email: email
        }).then(user => {
            userData = user;
            if (!user) {
                let error = new Error('The email is not found');
                error.statusCode = 401;
                throw error;
            }
            return bcrypt.compare(password, user.password);
        }).then(isMatch => {
            if (!isMatch) {
                let error = new Error('Incorrect password');
                error.statusCode = 401;
                throw error;
            }
            const token = jwt.sign({
                email: userData.email,
                userId: userData._id.toString()
            }, 'somesecretkey', {
                expiresIn: '1h'
            });
            res.status(200).json({
                token: token,
                userId: userData._id.toString()
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}