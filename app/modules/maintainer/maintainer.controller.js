'use strict';

module.exports = app => {
    const Constants = require( '../../common/constants' );
    const MaintainerService = require( './maintainer.service' );

    app.post( Constants.api.v1.maintainer.getNews, ( req, res ) => {
        MaintainerService.newsFeed( req.body.language || 'hu', req.body.category, req.body.itemCount, req.body.noImages ).then(
            result => result ? res.status( 200 ).json( { data: result, status: 200 } ) : res.status( 200 ).json( { data: {}, status: 500 } )
        );
    } );
};
