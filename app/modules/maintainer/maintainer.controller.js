"use strict";

module.exports = function (app) {
    var Constants = require('../../common/constants'),
        MaintainerService = require('./maintainer.service');

    app.post(Constants.api.v1.maintainer.getNews, function (req, res, next) {
        MaintainerService.newsFeed(req.body.language || 'en', req.body.category, req.body.itemCount).then(function (result) {
            if (result) {
                res.status(200).json({data: result, status: 200});
            } else {
                res.status(200).json({data: {}, status: 500});
                next();
            }
        });
    });

};