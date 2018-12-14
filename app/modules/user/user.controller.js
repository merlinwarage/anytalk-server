"use strict";
module.exports = function (app) {
    var UserService = require('./user.service'),
        Secret = require('../../common/secret'),
        Constants = require('../../common/constants'),
        AuthService = require('./auth.service');

    app.get(Constants.api.v1.user.getOne, function (req, res) {
        UserService.getUser(req.params.id).then(function (data) {
            res.status(200).json({data: data});
        }, function (error) {
            res.status(500).send(error.errorMessage);
        });
    });

    app.get(Constants.api.v1.user.validate, function (req, res) {
        AuthService.getUserId(req.params.token).then(function (userId) {
            UserService.getUser(userId).then(function (data) {
                res.status(200).json({data: data});
            }, function (error) {
                res.status(500).send(error.errorMessage);
            });
        });
    });

    app.get(Constants.api.v1.user.get, function (req, res) {
        UserService.getAllUsers().then(function (data) {
            res.status(200).json({data: data});
        }, function (error) {
            res.status(500).send(error.errorMessage);
        });
    });

    app.get(Constants.api.v1.user.getActivities, function (req, res) {
        console.log(req.get('X-Auth-Token'));
        AuthService.getUserId(req.get('X-Auth-Token')).then(function (userId) {
            if (userId) {
                UserService.getUserActivities(userId).then(function (data) {
                    res.status(200).json({data: data});
                }, function (error) {
                    res.status(500).send(error.errorMessage);
                });
            } else {
                res.status(200).json({data: {}});
            }
        });
    });

    app.post(Constants.api.v1.user.updateFavorites, function (req, res, next) {
        AuthService.getUserId(req.get('X-Auth-Token')).then(function (userId) {
            UserService.addFavorite(userId, req.body.room).then(function onSuccess(data) {
                res.status(200).json(data);
            }, function onError(error) {
                res.status(500).send(error.errorMessage);
                next();
            });
        });
    });

    app.put(Constants.api.v1.user.updateFavorites, function (req, res, next) {
        AuthService.getUserId(req.get('X-Auth-Token')).then(function (userId) {
            UserService.removeFavorite(userId, req.body.room).then(function onSuccess(data) {
                res.status(200).json(data);
            }, function onError(error) {
                res.status(500).send(error.errorMessage);
                next();
            });
        });
    });

    app.post(Constants.api.v1.user.save, function (req, res) {
        if (req.body._id) {
            UserService.updateUser(req).then(function (data) {
                if (data.errorMessage) {
                    res.status(500).send(data);
                } else {
                    res.status(200).json(data);
                }
            }, function (error) {
                res.status(500).send(error.errorMessage);
            });
        } else {
            UserService.addUser(req).then(function (data) {
                if (data.errorMessage) {
                    res.status(500).send(data);
                } else {
                    res.status(200).json(data);
                }
            }, function (error) {
                res.status(500).send(error.errorMessage);
            });
        }
    });

    app.delete(Constants.api.v1.user.delete, function (req, res) {
        AuthService.checkPermission(req.get('X-Auth-Token'), Constants.permissions.admin).then(function (permission) {
            if (permission) {
                UserService.deleteUser(req.params.id, req.query.deleted).then(function (data) {
                    if (data.errorMessage) {
                        res.status(500).send(data);
                    } else {
                        res.status(200).json(data);
                    }
                }, function (error) {
                    res.status(500).send(error.errorMessage);
                });
            } else {
                res.status(503).send('Permission Denied');
            }
        }, function () {
            res.status(503).send('Permission Denied');
        });
    });

};
