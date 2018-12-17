'use strict';

const User = require( '../../models/user' );
const UserService = require( './user.service' );
const Secret = require( '../../common/secret' );

const AuthService = ( () => {

    /**
     *
     * @param request
     * @returns {Promise}
     */
    function authUser( request ) {
        return new Promise( resolve => {
            if ( request.body.mail && request.body.password ) {
                return Secret.encrypt( request.body.password.toString() ).then(
                    encResult => {
                        request.body.password = encResult;
                        return User.findOne( request.body ).exec( ( err, user ) => {
                                // let tokenObj = tokenObj ? request.session.tokenObj : request.session.tokenObj = {};
                                let tokenObj = {};
                                if ( user && !user.deleted ) {
                                    Secret.encrypt( user._id.toString() ).then(
                                        encResult => {
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
                            },
                            err => {
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
            return await UserService.getUser( token ).then(
                user => user.permission === hasPermission,
                getUserError => {
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
        return Secret.decrypt( token ).then( userId => userId, () => false );
    }

    return {
        getUserId: getUserId,
        checkPermission: checkPermission,
        authUser: authUser
    };
} )();

module.exports = AuthService;
