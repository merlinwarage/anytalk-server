'use strict';

const Promise = require( 'bluebird' );
const User = require( '../../models/user' );
const UserService = require( './user.service' );
const Secret = require( '../../common/secret' );

var AuthService = ( function () {

    /**
     *
     * @param request
     * @returns {Promise}
     */
    function authUser( request ) {
        return new Promise( function ( resolve ) {
            if ( request.body.mail && request.body.password ) {
                return Secret.encrypt( request.body.password.toString() ).then( function ( encResult ) {
                    request.body.password = encResult;
                    return User.findOne( request.body ).exec( function ( err, user ) {
                        // var tokenObj = tokenObj ? request.session.tokenObj : request.session.tokenObj = {};
                        var tokenObj = {};
                        if ( user && !user.deleted ) {
                            Secret.encrypt( user._id.toString() ).then( function ( encResult ) {
                                tokenObj[ 'token' ] = encResult;
                                tokenObj[ 'loginDetails' ] = {
                                    userId: user._id,
                                    userName: user.name,
                                    userMail: user.mail,
                                    userPermission: user.permission,
                                    favorites: user.favorites
                                };
                                resolve( tokenObj );
                            } );
                        } else {
                            resolve( { errorMessage: 'invalidUsernameOrPassword' } );
                        }
                    }, function ( err ) {
                        if ( err ) {
                            resolve( { errorMessage: err.message } );
                        }
                    } );
                } );
            } else {
                resolve( { errorMessage: 'missingData' } );
            }
        } );
    }

    /**
     *
     * @param token
     * @param hasPermission
     * @returns {Promise}
     */
    async function checkPermission( token, hasPermission ) {
        return await Secret.decrypt( token ).then( async token => {
            return await UserService.getUser( token ).then( user => {
                return user.permission === hasPermission;
            }, function ( getUserError ) {
                return { errorMessage: getUserError.message };
            } );
        } );
    }

    /**
     *
     * @param token
     * @returns {*}
     */
    function getUserId( token ) {
        return Secret.decrypt( token ).then( function ( userId ) {
            return userId;
        }, function () {
            return false;
        } );
    }

    return {
        getUserId: getUserId,
        checkPermission: checkPermission,
        authUser: authUser
    };
} )();

module.exports = AuthService;
