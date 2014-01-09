var Backbone = require("backbone"),
        _ = require("underscore")
        mongoose = require('mongoose'),
        http =        require('http'),
        managers = require("./managers");

exports.schemas = {};

exports.schemas.User = new mongoose.Schema({
        username:String,
        password:{type:String, default:"password1234"},
        passwordSalt:String,
        role:{type:String, default:"user"},
        passwordResetCode:{type:Object, default:{}}
});