'use strict';

const Promise = require( 'bluebird' );
const User = require( '../../models/user' );
const Secret = require( '../../common/secret' );

var UserService = ( function () {

    function getUser( userId ) {
        return new Promise( function ( resolve ) {
            User.findOne( { _id: userId } ).select( { password: 0, activities: 0 } ).lean().exec( function ( err, docs ) {
                resolve( docs );
            }, function ( err ) {
                resolve( { errorMessage: err.message } );
            } );
        } );
    }

    function getAllUsers() {
        return new Promise( function ( resolve ) {
            User.find( {} ).sort( '-_id' ).exec( function ( err, docs ) {
                resolve( docs );
            }, function ( err ) {
                resolve( { errorMessage: err.message } );
            } );
        } );
    }

    function getUserActivities( userId ) {
        return new Promise( function ( resolve ) {
            User.findOne( { _id: userId } ).select( { activities: 1 } ).lean().exec( function ( err, docs ) {
                resolve( docs );
            }, function ( err ) {
                resolve( { errorMessage: err.message } );
            } );
        } );
    }

    function addUser( request ) {
        return Secret.encrypt( request.body.password.toString() ).then( function ( encResult ) {
            request.body.password = encResult;

            return new Promise( function ( resolve ) {
                User.create(
                    request.body,
                    function ( err, docs ) {
                        if ( err ) {
                            resolve( { errorMessage: err.message } );
                        }

                        resolve( docs );
                    } );
            } );

        } );
    }

    function updateUser( request ) {
        return Secret.encrypt( request.body.password.toString() ).then( function ( encResult ) {
            request.body.password = encResult;

            return new Promise( function ( resolve ) {
                User.update( { _id: request.body._id }, request.body,
                    function ( err ) {
                        if ( err ) {
                            resolve( { errorMessage: err.message } );
                        }

                        resolve( 200 );
                    } );
            } );
        } );
    }

    function deleteUser( userId, status ) {
        return new Promise( function ( resolve ) {
            User.findOneAndUpdate(
                { _id: userId },
                { deleted: status },
                function ( err ) {
                    if ( err ) {
                        resolve( { errorMessage: err.message } );
                    }

                    resolve( 200 );
                } );
        } );
    }

    function setActivities( userId, messageId, mode ) {
        return new Promise( function ( resolve ) {
            if ( mode > 0 ) {
                User.findOneAndUpdate(
                    { _id: userId },
                    {
                        $push: {
                            'activities.up': messageId
                        }
                    },
                    function onSuccess( err ) {
                        if ( err ) {
                            resolve( { errorMessage: err.message } );
                        }
                        resolve( true );
                    } );
            } else {
                User.findOneAndUpdate(
                    { _id: userId },
                    {
                        $push: {
                            'activities.down': messageId
                        }
                    },
                    function onSuccess( err ) {
                        if ( err ) {
                            resolve( { errorMessage: err.message } );
                        }
                        resolve( true );
                    } );
            }
        } );
    }

    function addFavorite( userId, roomId ) {
        return new Promise( function ( resolve ) {
            User.findOneAndUpdate(
                { _id: userId, 'activities.favorites': { $ne: roomId } },
                {
                    $push: {
                        'activities.favorites': roomId
                    }
                },
                function onSuccess( err ) {
                    if ( err ) {
                        resolve( { errorMessage: err.message } );
                    }
                    resolve( true );
                } );
        } );
    }

    function removeFavorite( userId, roomId ) {
        return new Promise( function ( resolve ) {
            User.findOneAndUpdate(
                { _id: userId, 'activities.favorites': roomId },
                {
                    $pull: {
                        'activities.favorites': roomId
                    }
                },
                function onSuccess( err ) {
                    if ( err ) {
                        resolve( { errorMessage: err.message } );
                    }
                    resolve( true );
                } );
        } );
    }

    return {
        getUser: getUser,
        getAllUsers: getAllUsers,
        getUserActivities: getUserActivities,
        addUser: addUser,
        updateUser: updateUser,
        deleteUser: deleteUser,
        setActivities: setActivities,
        addFavorite: addFavorite,
        removeFavorite: removeFavorite
    };
} )();

module.exports = UserService;
