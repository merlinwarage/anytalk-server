'use strict';

const User = require( '../../models/user' );
const Secret = require( '../../common/secret' );

const UserService = ( () => {

    function getUser( userId ) {
        return new Promise( resolve => {
            User.findOne( { _id: userId } ).select( { password: 0, activities: 0 } ).lean().exec().then(
                docs => {
                    resolve( docs );
                },
                err => {
                    resolve( { errorMessage: err.message } );
                } );
        } );
    }

    function getAllUsers() {
        return new Promise( resolve => {
            User.find( {} ).sort( '-_id' ).exec().then(
                docs => {
                    resolve( docs );
                }, err => {
                    resolve( { errorMessage: err.message } );
                } );
        } );
    }

    function getUserActivities( userId ) {
        return new Promise( resolve => {
            User.findOne( { _id: userId } ).select( { activities: 1 } ).lean().exec().then(
                docs => {
                    resolve( docs );
                }, err => {
                    resolve( { errorMessage: err.message } );
                } );
        } );
    }

    function addUser( request ) {
        return Secret.encrypt( request.body.password.toString() ).then( encResult => {
            request.body.password = encResult;

            return new Promise( resolve => {
                User.create(
                    request.body,
                    ( err, docs ) => {
                        if ( err ) {
                            resolve( { errorMessage: err.message } );
                        }

                        resolve( docs );
                    } );
            } );

        } );
    }

    function updateUser( request ) {
        return Secret.encrypt( request.body.password.toString() ).then( encResult => {
            request.body.password = encResult;

            return new Promise( resolve => {
                User.update( { _id: request.body._id }, request.body,
                    err => {
                        if ( err ) {
                            resolve( { errorMessage: err.message } );
                        }

                        resolve( 200 );
                    } );
            } );
        } );
    }

    function deleteUser( userId, status ) {
        return new Promise( resolve => {
            User.findOneAndUpdate(
                { _id: userId },
                { deleted: status },
                err => {
                    if ( err ) {
                        resolve( { errorMessage: err.message } );
                    }

                    resolve( 200 );
                } );
        } );
    }

    function setActivities( userId, messageId, mode ) {
        return new Promise( resolve => {
            if ( mode > 0 ) {
                User.findOneAndUpdate(
                    { _id: userId },
                    {
                        $push: {
                            'activities.up': messageId
                        }
                    },
                    err => {
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
                    err => {
                        if ( err ) {
                            resolve( { errorMessage: err.message } );
                        }
                        resolve( true );
                    } );
            }
        } );
    }

    function addFavorite( userId, roomId ) {
        return new Promise( resolve => {
            User.findOneAndUpdate(
                { _id: userId, 'activities.favorites': { $ne: roomId } },
                {
                    $push: {
                        'activities.favorites': roomId
                    }
                },
                err => {
                    if ( err ) {
                        resolve( { errorMessage: err.message } );
                    }
                    resolve( true );
                } );
        } );
    }

    function removeFavorite( userId, roomId ) {
        return new Promise( resolve => {
            User.findOneAndUpdate(
                { _id: userId, 'activities.favorites': roomId },
                {
                    $pull: {
                        'activities.favorites': roomId
                    }
                },
                err => {
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
