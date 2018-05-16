'use strict';
module.exports = function ( app ) {

    const Constants = require('../../common/constants'),
        AuthService = require('../user/auth.service'),
        UserService = require('../user/user.service'),
        RoomService = require('../messenger/room.service'),
        DbConvertService = require('./db-convert.service');

    const categories = {
        general: 1,
        gaming: 2,
        technology: 4,
        entertainment: 7,
        music: 9,
        science: 14,
        social: 20,
        sport: 25
    };

    app.get('/api/v1/convert', function ( req, res, next ) {
        DbConvertService.convertRoomData(categories[req.query.c], req.query.p).then(function ( convertedRoomData ) {
            DbConvertService.convertMessageData(convertedRoomData).then(function ( result ) {
                res.status(200).json({data: result});
            });
        }, function onError( error ) {
            res.status(500).send(error.errorMessage);
        });
    });

    app.get('/api/v1/finalize/1', function ( req, res, next ) {
        DbConvertService.finalizeData(req.query.c).then(function ( data ) {
            res.status(200).send(data);
        }, function ( error ) {
            res.status(500).send(error.errorMessage);
        });
    });

    app.get('/api/v1/finalize/2', function ( req, res, next ) {
        DbConvertService.convertReplyEntities(req.query.c).then(function ( data ) {
            res.status(200).send(data);
        }, function ( error ) {
            res.status(500).send(error.errorMessage);
        });
    });

    app.get('/api/v1/finalize/3', function ( req, res, next ) {
        DbConvertService.createUserEntities(req.query.c).then(function ( data ) {
            res.status(200).send(data);
        }, function ( error ) {
            res.status(500).send(error.errorMessage);
        });
    });

    app.get('/api/v1/usernames', function ( req, res, next ) {
        DbConvertService.changePlaceholderUsers(req.query.c).then(function ( data ) {
            res.status(200).send(data);
        }, function ( error ) {
            res.status(500).send(error.errorMessage);
        });
    });

    app.get('/api/v1/roomactivities', function ( req, res, next ) {
        DbConvertService.roomUserActivities(req.query.c).then(function ( data ) {
            res.status(200).send(data);
        }, function ( error ) {
            res.status(500).send(error.errorMessage);
        });
    });

};