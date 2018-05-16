"use strict";
module.exports = function (app) {

    var Constants = require('../../common/constants'),
        AuthService = require('./auth.service');

    app.post(Constants.api.v1.user.login, function (req, res) {
        AuthService.authUser(req).then(function (data) {
            if (data.errorMessage) {
                res.status(401).send(data);
            } else {
                res.status(200).json(data);
            }
        });
    });

    // app.get(Constants.api.v1.user.logout, function (req, res) {
    //     UserService.getUser(req).then(function (data) {
    //         if (data.error) {
    //             res.status(500).send(data);
    //         } else {
    //             res.status(200).json(data);
    //         }
    //     });
    // });

};