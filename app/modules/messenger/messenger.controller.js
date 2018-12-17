'use strict';
module.exports = app => {
    const Constants = require( '../../common/constants' );
    const AuthService = require( '../user/auth.service' );
    const MessengerService = require( './messenger.service' );
    const RoomService = require( './room.service' );


    app.get( Constants.api.v1.message.get, ( req, res ) => {
        MessengerService.getAllMessages( req ).then(
            data => res.status( 200 ).json( { data: data } ),
            error => res.status( 500 ).send( error.errorMessage )
        );
    } );

    app.get( Constants.api.v1.message.getOne, ( req, res ) => {
        MessengerService.getMessageById( req ).then(
            data => res.status( 200 ).json( { data: data } ),
            error => res.status( 500 ).send( error.errorMessage )
        );
    } );

    app.post( Constants.api.v1.message.paginate, ( req, res ) => {
        MessengerService.getMessagesByPage( req ).then(
            data => res.status( 200 ).json( { data: data } ),
            error => res.status( 500 ).send( error.errorMessage )
        );
    } );

    /**
     * 1. Dupecheck
     * 2. add message
     * 3. update room status
     */
    app.post( Constants.api.v1.message.save, ( req, res ) => {
        const lang = req.get( 'X-Language' );
        RoomService.checkDupe( req, lang ).then(
            dupeResult => {
                if ( !dupeResult ) {
                    const StrippedString = req.body.message.replace( /(<([^>]+)>)/ig, '' ).replace( /\[([^\]]+)\]/ig, '' );
                    if ( StrippedString.trim() ) {
                        MessengerService.addMessage( req ).then( dataResult => {
                                RoomService.updateRoomStatus( req, 'update' ).then(
                                    roomResponse => {
                                        res.status( 200 ).json( { data: dataResult, dupe: roomResponse } );
                                    } );
                            },
                            error => {
                                res.status( 200 ).json( { error: error.errorMessage } );
                            } );
                    } else {
                        res.status( 200 ).json( { error: 'Empty message' } );
                    }
                } else {
                    res.status( 200 ).json( { error: 'Duplicated message' } );
                }
            }, error => {
                res.status( 500 ).send( error.errorMessage );
            } );
    } );

    app.delete( Constants.api.v1.message.delete, ( req, res ) => {
        MessengerService.deleteMessage( req ).then(
            () => RoomService.updateRoomStatus( req, 'delete' ).then(
                roomResponse => res.status( 200 ).json( roomResponse ),
                error => res.status( 500 ).send( error.errorMessage )
            ),
            error => res.status( 500 ).send( error.errorMessage ) );
    } );

    app.put( Constants.api.v1.message.vote, ( req, res ) => {
        AuthService.getUserId( req.get( 'X-Auth-Token' ) ).then( userId => {
            req.body.voteUserId = userId;

            MessengerService.setVote( req ).then(
                data => res.status( 200 ).json( { data: data } ),
                error => res.status( 500 ).send( error.errorMessage )
            );
        } );
    } );
};
