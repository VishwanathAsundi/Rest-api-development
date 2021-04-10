const Post = require('../models/post');
const fs = require('fs');
const path = require('path');
const User = require('../models/user');

const {
    validationResult
} = require('express-validator');

exports.getPosts = (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    let totalItems;

    Post.find().countDocuments().then(count => {
            totalItems = count;
            return Post.find().skip((currentPage - 1) * perPage).limit(perPage);
        }).then(posts => {
            res.status(200).json({
                message: 'posts fetched successfully',
                posts: posts,
                totalItems: totalItems
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId).then(post => {
        if (!post) {
            let error = new Error('Post is empty');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            message: 'post fetched',
            post: post
        });
    }).catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })
}

exports.createPost = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    console.log(req, 'req');
    // if (!req.file) {
    //     const error = new Error('No image provided');
    //     error.statusCode = 422;
    //     throw error;
    // }
    const title = req.body.title;
    const content = req.body.content;
    // const imageUrl = req.file.path;

    let post = new Post({
        title: title,
        content: content,
        imageUrl: 'images/a.jpg',
        creator: req.userId
    })
    let creator;
    post.save().then(result => {
        return User.findById(req.userId);
    }).then(user => {
        creator = user;
        user.posts.push(post);
        return user.save();
    }).then(result => {
        res.status(201).json({
            message: "Post creted successfully!",
            post: post,
            creator: {
                _id: creator._id,
                name: creator.name
            }
        })
    }).catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })

}
exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    const imageUrl = req.body.image;
    if (req.file) {
        imageUrl = req.file.path;
    }
    if (!imageUrl) {
        const error = new Error('No file picked');
        error.statusCode = 422;
        throw error;
    }
    Post.findById(postId).then(post => {
            if (!post) {
                let error = new Error('Post is empty');
                error.statusCode = 404;
                throw error;
            }
            if (post.creator.toString() !== req.userId) {
                let error = new Error('Not authorized');
                error.statusCode = 403;
                throw error;
            }
            if (imageUrl !== post.imageUrl) {
                clearImage(post.imageUrl);
            }
            post.title = title;
            post.content = content;
            post.imageUrl = imageUrl;
            return post.save();
        }).then(result => {
            res.status(200).json({
                message: "Post updated successfully!",
                post: result
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId).then(post => {
            if (!post) {
                let error = new Error('Post not found');
                error.statusCode = 404;
                throw error;
            }
            if (post.creator.toString() !== req.userId) {
                let error = new Error('Not authorized');
                error.statusCode = 403;
                throw error;
            }
            clearImage(post.imageUrl);
            return Post.findByIdAndRemove(postId);
        }).then(result => {
            return User.findById(req.userId);
        }).then(user => {
            user.posts.pull(postId);
            return user.save();
        }).then(result => {
            res.status(200).json({
                message: "post deleted!"
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });

}
const clearImage = (filePath) => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => {
        console.log(err);
    })
}