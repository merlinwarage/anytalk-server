'use strict';
const UserService = require( '../user/user.service' );
const RoomService = require( './room.service' );

let Messages = {};

RoomService.getAllRoomsId().then(
    function onSuccess( rooms ) {
        Messages = require( '../../models/messenger' )( rooms );
    },
    function onError( err ) {
        if ( err ) {
            return { errorMessage: err.message };
        }
    } );

const MessengerService = ( function () {
    /**
     *
     * @param request
     */
    async function getAllMessages( request ) {
        return await Messages[ request.params.room ].find( {} ).sort( '-_id' ).populate( 'user', 'name' ).lean().exec().then( docs => docs,
            err => {
                return { errorMessage: err.message };
            }
        );
    }

    /**
     *
     * @param request
     */
    async function getMessagesByPage( request ) {
        const query = request.body.query;
        const options = {
            select: {},
            sort: { createdAt: -1 },
            populate: [ { path: 'user', select: 'name' } ], //, match: {name: 'admin'}
            lean: true,
            offset: parseInt( request.body.from ),
            limit: parseInt( request.body.to )
        };

        return await Messages[ request.body.room ].paginate( query, options ).then(
            async result => {
                await result.docs.forEach( ( item, key ) => {
                    if ( item.user == null ) {
                        delete result.docs[ key ];
                    }
                } );
                return result;
            }, err => {
                return { errorMessage: err };
            } );
    }

    /**
     *
     * @param request
     */
    async function getMessageById( request ) {
        return await Messages[ request.params.room ].findOne( { _id: request.params.id } ).populate( 'user', 'name' ).lean().exec().then(
            docs => docs,
            err => {
                return { errorMessage: err.message };
            } );
    }

    /**
     *
     * @param request
     */
    async function deleteMessage( request ) {
        return await Messages[ request.params.room ].deleteOne( { _id: request.params.id },
            err => err ? { errorMessage: err.message } : true
        );
    }

    /**
     *
     * @param request
     */
    function addMessage( request ) {
        return new Promise( function ( resolve ) {
            if ( request.body.message.length > 1 ) {

                let messageData = {
                    user: request.body.user,
                    message: request.body.message,
                    'replyTo._id': request.body.replyToId,
                    'replyTo.name': request.body.replyToName,
                    updatedAt: request.body.updatedAt,
                    createdAt: request.body.createdAt,
                    __vendorData: request.body.__vendorData
                };

                return Messages[ request.body.room ].create( messageData,
                    ( err, message ) => resolve( err ? { errorMessage: err.message } : message )
                );
            } else {
                resolve( true );
            }
        } );
    }

    /**
     *
     * @param request
     */
    function editMessage( request ) {
        return new Promise( function ( resolve ) {
            if ( request.body.message.length > 1 ) {

                let messageData = {
                    user: request.body.user,
                    message: request.body.message,
                    'replyTo._id': request.body.replyToId,
                    'replyTo.name': request.body.replyToName,
                    updatedAt: request.body.updatedAt,
                    __vendorData: request.body.__vendorData
                };

                return Messages[ request.body.room ].findOneAndUpdate( { _id: request.body.messageId }, messageData,
                    ( err, message ) => resolve( err ? { errorMessage: err.message } : message )
                );
            } else {
                resolve( true );
            }
        } );
    }

    /**
     *
     * @param request
     */
    function setVote( request ) {
        let upVote;
        let downVote;

        if ( request.body.vote > 0 ) {
            upVote = 1;
            downVote = 0;
        } else {
            upVote = 0;
            downVote = 1;
        }

        return new Promise( function ( resolve ) {
            return Messages[ request.body.room ].findOneAndUpdate(
                { _id: request.body.messageId },
                { $inc: { upVote: upVote, downVote: downVote } },
                function onSuccess( err ) {
                    if ( err ) {
                        resolve( { errorMessage: err.message } );
                    }

                    UserService.setActivities( request.body.voteUserId, request.body.messageId, request.body.vote );

                    resolve( true );
                } );
        } );
    }

    return {
        getAllMessages: getAllMessages,
        getMessagesByPage: getMessagesByPage,
        getMessageById: getMessageById,
        deleteMessage: deleteMessage,
        addMessage: addMessage,
        editMessage: editMessage,
        setVote: setVote
    };
} )();

module.exports = MessengerService;

// Model.find(
//     {user: 1},
//     ['user', 'message'], // Columns to Return
//     {
//         skip: 0, // Starting Row
//         limit: 30, // Ending Row
//         sort: {
//             _id: -1 //Sort by Date Added DESC
//         }
//     }, function (err, models) {
//         console.log(models);
//         return models;
//     });
