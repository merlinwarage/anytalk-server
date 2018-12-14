'use strict';
module.exports = function ( app ) {
    const Constants = require( '../../common/constants' ),
        AuthService = require( '../user/auth.service' ),
        UserService = require( '../user/user.service' ),
        RoomService = require( './room.service' );

    app.get( Constants.api.v1.room.getFeatured, function ( req, res, next ) {
        let lang = req.get( 'X-Language' );
        RoomService.getFeaturedRooms( lang ).then( function onSuccess( data ) {
            res.status( 200 ).json( { data: data } );
        }, function onError( error ) {
            res.status( 500 ).send( error.errorMessage );
            next();
        } );
    } );

    app.get( Constants.api.v1.room.getHot, function ( req, res, next ) {
        let lang = req.get( 'X-Language' );
        RoomService.getHotRooms( lang, req.query.category, req.query.pageModifier, req.query.limit ).then( function onSuccess( data ) {
            res.status( 200 ).json( { data: data } );
        }, function onError( error ) {
            res.status( 500 ).send( error.errorMessage );
            next();
        } );
    } );

    app.get( Constants.api.v1.room.getNew, function ( req, res, next ) {
        let lang = req.get( 'X-Language' );
        RoomService.getNewRooms( lang, req.query.category, req.query.pageModifier, req.query.limit ).then( function onSuccess( data ) {
            res.status( 200 ).json( { data: data } );
        }, function onError( error ) {
            res.status( 500 ).send( error.errorMessage );
            next();
        } );
    } );

    app.get( Constants.api.v1.room.getPrivates, function ( req, res, next ) {
        let lang = req.get( 'X-Language' );
        AuthService.getUserId( req.get( 'X-Auth-Token' ) ).then( function ( userId ) {
            if ( userId ) {
                RoomService.getPrivateRooms( userId, lang ).then( function onSuccess( data ) {
                    res.status( 200 ).json( { data: data } );
                }, function onError( error ) {
                    res.status( 500 ).send( error.errorMessage );
                    next();
                } );
            } else {
                res.status( 200 ).json( { data: {} } );
            }
        } );
    } );

    app.get( Constants.api.v1.room.getFavorites, function ( req, res, next ) {
        const lang = req.get( 'X-Language' );
        const token = req.get( 'X-Auth-Token' );
        AuthService.getUserId( token ).then( function ( userId ) {
            if ( userId ) {
                UserService.getUserActivities( userId ).then( function ( userActivities ) {
                    if ( userActivities && userActivities.activities && userActivities.activities.favorites ) {
                        RoomService.getFavoriteRooms( userActivities.activities.favorites, lang ).then( function onSuccess( data ) {
                            res.status( 200 ).json( { data: data } );
                        }, function onError( error ) {
                            res.status( 500 ).send( error.errorMessage );
                            next();
                        } );
                    }
                } );
            }
        } );
    } );

    app.get( Constants.api.v1.room.getOne, function ( req, res, next ) {
        RoomService.getRoomById( req.params.id ).then( function onSuccess( data ) {
            res.status( 200 ).json( { data: data } );
        }, function onError( error ) {
            res.status( 500 ).send( error.errorMessage );
            next();
        } );
    } );

    app.get( Constants.api.v1.room.getOneByTitle, function ( req, res, next ) {
        RoomService.getRoomByTitle( req.params.title ).then( function onSuccess( data ) {
            res.status( 200 ).json( { data: data } );
        }, function onError( error ) {
            res.status( 500 ).send( error.errorMessage );
            next();
        } );
    } );

    app.post( Constants.api.v1.room.paginate, function ( req, res, next ) {
        let lang = req.get( 'X-Language' );
        RoomService.getRoomsByPage( req, lang ).then( function onSuccess( data ) {
            res.status( 200 ).json( { data: data } );
        }, function onError( error ) {
            res.status( 200 ).send( error );
            next();
        } );
    } );

    app.post( Constants.api.v1.room.save, function ( req, res, next ) {
        if ( req.body._id ) {
            RoomService.updateRoom( req ).then( function onSuccess( data ) {
                if ( data.errorMessage ) {
                    res.status( 500 ).send( data );
                } else {
                    res.status( 200 ).json( data );
                }
            }, function ( error ) {
                res.status( 500 ).send( error.errorMessage );
                next();
            } );
        } else {
            let lang = req.get( 'X-Language' );
            RoomService.addRoom( req, lang ).then( function onSuccess( data ) {
                res.status( 200 ).json( data );
            }, function ( error ) {
                res.status( 500 ).send( error.errorMessage );
                next();
            } );
        }
    } );

    app.post( Constants.api.v1.room.saveMember, function ( req, res, next ) {
        RoomService.addMember( req ).then( function onSuccess( data ) {
            res.status( 200 ).json( data );
        }, function onError( error ) {
            res.status( 500 ).send( error.errorMessage );
            next();
        } );
    } );

    app.put( Constants.api.v1.room.saveMember, function ( req, res, next ) {
        RoomService.removeMember( req ).then( function onSuccess( data ) {
            res.status( 200 ).json( data );
        }, function onError( error ) {
            res.status( 500 ).send( error.errorMessage );
            next();
        } );
    } );

    app.post( Constants.api.v1.room.getNews, function ( req, res, next ) {
        RoomService.getNews( req.body ).then( function onSuccess( data ) {
            res.status( 200 ).json( data );
        }, function onError( error ) {
            res.status( 200 ).send( error.errorMessage );
            next();
        } );
    } );

    app.delete( Constants.api.v1.room.delete, function ( req, res, next ) {
        RoomService.deleteRoom( req ).then( function onSuccess( data ) {
            res.status( 200 ).json( data );
        }, function onError( error ) {
            res.status( 500 ).send( error.errorMessage );
            next();
        } );
    } );

};
