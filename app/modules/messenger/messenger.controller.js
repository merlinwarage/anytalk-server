"use strict";
module.exports = function (app) {
    const mongoose = require('mongoose');
    const Constants = require('../../common/constants'),
        AuthService = require('../user/auth.service'),
        MessengerService = require('./messenger.service'),
        RoomService = require('./room.service');


    app.get(Constants.api.v1.message.get, function (req, res) {
        MessengerService.getAllMessages(req).then(function (data) {
            res.status(200).json({data: data});
        }, function (error) {
            res.status(500).send(error.errorMessage);
        });
    });

    app.get(Constants.api.v1.message.getOne, function (req, res) {
        MessengerService.getMessageById(req).then(function (data) {
            res.status(200).json({data: data});
        }, function (error) {
            res.status(500).send(error.errorMessage);
        });
    });

    app.post(Constants.api.v1.message.paginate, function (req, res) {
        MessengerService.getMessagesByPage(req).then(function (data) {
            res.status(200).json({data: data});
        }, function (error) {
            res.status(500).send(error.errorMessage);
        });
    });

    app.post(Constants.api.v1.message.save, function (req, res) {

        RoomService.checkDupe(req).then(function (dupeResult) {
            if (!dupeResult) {
                var StrippedString = req.body.message.replace(/(<([^>]+)>)/ig, "").replace(/\[([^\]]+)\]/ig, "");
                if (StrippedString.trim()) {
                    MessengerService.addMessage(req).then(function (dataResult) {
                        RoomService.updateRoomStatus(req, 'update').then(function (roomResponse) {
                            res.status(200).json({data: dataResult, dupe: roomResponse});
                        });
                    }, function (error) {
                        res.status(200).json({error: error.errorMessage});
                    });
                } else {
                    res.status(200).json({error: 'Empty message'});
                }
            } else {
                res.status(200).json({error: 'Duplicated message'});
            }
        }, function (error) {
            res.status(500).send(error.errorMessage);
        });
    });

    app.delete(Constants.api.v1.message.delete, function (req, res) {
        MessengerService.deleteMessage(req).then(function () {
            RoomService.updateRoomStatus(req, 'delete').then(function (roomResponse) {
                res.status(200).json(roomResponse);
            });
        }, function (error) {
            res.status(500).send(error.errorMessage);
        });
    });

    app.put(Constants.api.v1.message.vote, function (req, res) {
        AuthService.getUserId(req.get('X-Auth-Token')).then(function (userId) {
            req.body.voteUserId = userId;

            MessengerService.setVote(req).then(function (data) {
                res.status(200).json({data: data});
            }, function (error) {
                res.status(500).send(error.errorMessage);
            });
        });
    });
};