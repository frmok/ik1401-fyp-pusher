/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

module.exports = {

    /**
     * This method checks the credential and returna JWT token
     *
     * @method login
     * @param username {String} The username
     * @param password {String} The password
     * @return {Object} Returns a object with JWT token
     */
    login: function(req, res) {
        var username = req.param("username");
        var password = req.param("password");
        User
            .findOneByUsername(username)
            .exec(function(err, user) {
                if (err) {
                    res.send(500, {
                        error: "FATAL ERROR"
                    });
                } else {
                    if (user) {
                        bcrypt.compare(password, user.password, function(err, match) {
                            if (match) {
                                var token = jwt.sign({
                                    username: username,
                                    right: user.right
                                }, sails.config.myconf.secret, {
                                    expiresInMinutes: 60 * 24 * 3
                                });
                                res.send({
                                    token: token
                                });
                            } else {
                                res.send(400, {
                                    error: "Invalid username or password."
                                });
                            }
                        })
                    }
                }
            });

    },

    /**
     * This method creates a new user
     *
     * @method create
     * @param username {String} The username
     * @param password {String} The password
     * @return {Object} Returns a object with debug message
     */
    create: function(req, res) {
        var username = req.param("username");
        var password = req.param("password");
        User
            .create({
                username: username,
                password: password
            })
            .exec(function(err, user) {
                if (err) {
                    res.send(500, {
                        error: "FATAL ERROR"
                    });
                } else {
                    res.send({
                        message: "Success"
                    });
                }
            });
    },
};