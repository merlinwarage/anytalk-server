'use strict';
module.exports = app => {

    const Constants = require( '../../common/constants' ),
        AuthService = require( '../user/auth.service' ),
        UserService = require( '../user/user.service' ),
        RoomService = require( './room.service' );

    app.get( Constants.api.v1.room.getFeatured, ( req, res ) => {
        let lang = req.get( 'X-Language' );
        RoomService.getFeaturedRooms( lang ).then(
            data => res.status( 200 ).json( { data: data } ),
            error => res.status( 500 ).send( error.errorMessage )
        );
    } );

    app.get( Constants.api.v1.room.getHot, ( req, res ) => {
        let lang = req.get( 'X-Language' );
        RoomService.getHotRooms( lang, req.query.category, req.query.pageModifier, req.query.limit ).then(
            data => res.status( 200 ).json( { data: data } ),
            error => res.status( 500 ).send( error.errorMessage )
        );
    } );

    app.get( Constants.api.v1.room.getNew, ( req, res ) => {
        let lang = req.get( 'X-Language' );
        RoomService.getNewRooms( lang, req.query.category, req.query.pageModifier, req.query.limit ).then(
            data => res.status( 200 ).json( { data: data } ),
            error => res.status( 500 ).send( error.errorMessage )
        );
    } );

    app.get( Constants.api.v1.room.getPrivates, ( req, res ) => {
        let lang = req.get( 'X-Language' );
        AuthService.getUserId( req.get( 'X-Auth-Token' ) ).then( userId => {
            if ( userId ) {
                RoomService.getPrivateRooms( userId, lang ).then(
                    data => res.status( 200 ).json( { data: data } ),
                    error => res.status( 500 ).send( error.errorMessage )
                );
            } else {
                res.status( 200 ).json( { data: {} } );
            }
        } );
    } );

    app.get( Constants.api.v1.room.getFavorites, ( req, res ) => {
        const lang = req.get( 'X-Language' );
        const token = req.get( 'X-Auth-Token' );
        AuthService.getUserId( token ).then( ( userId ) => {
            if ( userId ) {
                UserService.getUserActivities( userId ).then( ( userActivities ) => {
                    if ( userActivities && userActivities.activities && userActivities.activities.favorites ) {
                        RoomService.getFavoriteRooms( userActivities.activities.favorites, lang ).then(
                            data => res.status( 200 ).json( { data: data } ),
                            error => res.status( 500 ).send( error.errorMessage )
                        );
                    }
                } );
            }
        } );
    } );

    app.get( Constants.api.v1.room.getOne, ( req, res ) => {
        RoomService.getRoomById( req.params.id ).then(
            data => res.status( 200 ).json( { data: data } ),
            error => res.status( 500 ).send( error.errorMessage )
        );
    } );

    app.get( Constants.api.v1.room.getOneByTitle, ( req, res ) => {
        RoomService.getRoomByTitle( req.params.title ).then(
            data => res.status( 200 ).json( { data: data } ),
            error => res.status( 500 ).send( error.errorMessage )
        );
    } );

    app.post( Constants.api.v1.room.paginate, ( req, res ) => {
            let lang = req.get( 'X-Language' );
            RoomService.getRoomsByPage( req, lang ).then(
                data => res.status( 200 ).json( { data: data } ),
                error => res.status( 200 ).send( error )
            );
        }
    );


    app.post( Constants.api.v1.room.save, ( req, res ) => {
        if ( req.body._id ) {
            RoomService.updateRoom( req ).then(
                data => data.errorMessage ? res.status( 500 ).senddata : res.status( 200 ).senddata,
                error => res.status( 500 ).send( error.errorMessage )
            );
        } else {
            const lang = req.get( 'X-Language' );
            RoomService.addRoom( req, lang ).then(
                data => res.status( 200 ).json( data ),
                error => res.status( 500 ).send( error.errorMessage )
            );
        }
    } );

    app.post( Constants.api.v1.room.saveMember, ( req, res ) => {
        RoomService.addMember( req ).then( data => {
            res.status( 200 ).json( data );
        }, error => {
            res.status( 500 ).send( error.errorMessage );
        } );
    } );

    app.put( Constants.api.v1.room.saveMember, ( req, res ) => {
        RoomService.removeMember( req ).then( data => {
            res.status( 200 ).json( data );
        }, error => {
            res.status( 500 ).send( error.errorMessage );
        } );
    } );

    app.post( Constants.api.v1.room.getNews, ( req, res ) => {
        RoomService.getNews( req.body ).then( data => {
            res.status( 200 ).json( data );
        }, error => {
            res.status( 200 ).send( error.errorMessage );
        } );
    } );

    app.delete( Constants.api.v1.room.delete, ( req, res ) => {
        RoomService.deleteRoom( req ).then( data => {
            res.status( 200 ).json( data );
        }, error => {
            res.status( 500 ).send( error.errorMessage );
        } );
    } );

}
;
