'use strict';

const mongoose = require( 'mongoose' );
const Rooms = require( '../../models/room' );
const News = require( '../../models/news' );
const Request = require( 'request' );
const async = require( 'async' );
const Constants = require( '../../common/constants' );
const Utils = require( '../../common/utils' );
mongoose.Promise = Promise;

const RoomService = ( function () {
    /**
     *
     * @returns {Promise}
     */

    function getFeaturedRooms( lang ) {
        return new Promise( function ( resolve ) {
            let populateQuery;

            populateQuery = [
                { path: 'user', select: 'name' },
                { path: 'updatedBy', select: 'name' },
                { path: 'members', select: 'name' }
            ];

            return Rooms.find(
                {
                    $and: [ { private: false }, { featured: true } ], $or: [ { language: lang }, { language: undefined } ]
                }
            ).sort( '-createdAt' ).limit( 10 ).populate( populateQuery ).lean().exec( function ( err, docs ) {
                resolve( docs );
            }, function ( err ) {
                resolve( err ? { errorMessage: err.message } : true );
            } );
        } );
    }

    function getHotRooms( lang, category, pageModifier, limit ) {
        return new Promise( function ( resolve ) {
            let populateQuery;
            let select;
            let pageLimit = limit ? limit : 10;

            populateQuery = [
                { path: 'user', select: 'name' },
                { path: 'updatedBy', select: 'name' },
                { path: 'members', select: 'name' }
            ];

            if ( category ) {
                select = {
                    $and: [ { category: category }, { private: false }, { messageCount: { $gt: 0 } } ],
                    $or: [ { language: lang }, { language: undefined } ]
                };
            } else {
                select = {
                    $and: [ { private: false }, { messageCount: { $gt: 0 } } ],
                    $or: [ { language: lang }, { language: undefined } ]
                };
            }

            return Rooms.find( select ).sort( '-updatedAt' ).skip( parseInt( pageModifier ) ).limit( parseInt( pageLimit ) ).populate( populateQuery ).lean().exec( function ( err, docs ) {
                resolve( docs );
            }, function ( err ) {
                resolve( err ? { errorMessage: err.message } : true );
            } );
        } );
    }

    function getNewRooms( lang, category, pageModifier, limit ) {
        return new Promise( function ( resolve ) {
            let populateQuery;
            let select;
            let pageLimit = limit ? limit : 10;

            populateQuery = [
                { path: 'user', select: 'name' },
                { path: 'updatedBy', select: 'name' },
                { path: 'members', select: 'name' }
            ];

            if ( category ) {
                select = {
                    $and: [ { category: category }, { private: false } ],
                    $or: [ { language: lang }, { language: undefined } ]
                };
            } else {
                select = {
                    $and: [ { private: false } ],
                    $or: [ { language: lang }, { language: undefined } ]
                };
            }

            return Rooms.find( select ).sort( '-createdAt' ).skip( parseInt( pageModifier ) ).limit( pageLimit ).populate( populateQuery ).lean().exec( function ( err, docs ) {
                resolve( docs );
            }, function ( err ) {
                resolve( err ? { errorMessage: err.message } : true );
            } );
        } );
    }

    async function getFavoriteRooms( favlist, lang ) {
        let favoriteRooms = [];
        await Promise.all( favlist.map( async ( item ) => {
            await getRoomById( item, lang ).then( res => {
                if ( res ) {
                    favoriteRooms[ favoriteRooms.length ] = res;
                }
            } );
        } ) );
        return favoriteRooms || {};
    }

    function getPrivateRooms( userId, lang ) {
        return new Promise( function ( resolve ) {
            let populateQuery;

            populateQuery = [
                { path: 'user', select: 'name' },
                { path: 'updatedBy', select: 'name' },
                { path: 'members', select: 'name' }
            ];

            return Rooms.find( {
                    $and: [ { private: true }, { $or: [ { members: { $in: [ userId ] } }, { user: userId } ] } ],
                    $or: [ { language: lang }, { language: undefined } ]
                }
            ).sort( '-_id' ).populate( populateQuery ).lean().exec( function ( err, docs ) {
                resolve( docs );
            }, function ( err ) {
                resolve( err ? { errorMessage: err.message } : true );
            } );
        } );
    }

    /**
     * For Schema Models
     */
    function getAllRoomsId() {
        return new Promise( function ( resolve ) {
            let populateQuery;

            populateQuery = [
                { path: 'user', select: 'name' },
                { path: 'updatedBy', select: 'name' },
                { path: 'members', select: 'name' }
            ];

            return Rooms.find( {} ).sort( '-_id' ).populate( populateQuery ).lean().exec( function ( err, docs ) {
                let rooms = [];
                for ( let key in docs ) {
                    if ( docs.hasOwnProperty( key ) ) {
                        rooms.push( docs[ key ]._id );
                    }
                }
                resolve( rooms );
            }, function ( err ) {
                resolve( err ? { errorMessage: err.message } : true );
            } );
        } );
    }

    /**
     *
     * @param roomId
     * @param lang?
     * @returns {Promise}
     */

    async function getRoomById( roomId, lang ) {
        const populateQuery = [
            { path: 'user', select: 'name' },
            { path: 'updatedBy', select: 'name' },
            { path: 'members', select: 'name' }
        ];

        return await Rooms
            .findOne( { _id: roomId, language: lang } )
            .populate( populateQuery )
            .lean()
            .then( docs => docs, err => err ? { errorMessage: err.message } : true );
    }

    /**
     *
     * @param roomTitle
     * @returns {Promise}
     */
    function getRoomByTitle( roomTitle ) {
        return new Promise( function ( resolve ) {
            var populateQuery = [
                { path: 'user', select: 'name' },
                { path: 'updatedBy', select: 'name' },
                { path: 'members', select: 'name' }
            ];
            return Rooms.findOne( { titleNorm: roomTitle } ).populate( populateQuery ).lean().exec( function ( err, docs ) {
                resolve( docs );
            }, function ( err ) {
                resolve( err ? { errorMessage: err.message } : true );
            } );
        } );
    }

    /**
     *
     * @param request
     * @param lang
     * @returns {Promise}
     */
    function getRoomsByPage( request, lang ) {
        return new Promise( function ( resolve ) {
            var populateQuery = [
                { path: 'user', select: 'name' },
                { path: 'updatedBy', select: 'name' },
                { path: 'members', select: 'name' }
            ];

            var query = request.body.query;
            if ( request.body.category && request.body.category !== 'home' ) {
                query.$and = [ { private: false, language: lang, category: request.body.category } ];
            } else {
                query.$and = [ { private: false, language: lang } ];
            }
            query.$or = [ { language: lang }, { language: undefined } ];

            var options = {
                select: {},
                sort: { title: 1 },
                populate: [ populateQuery ], //, match: {name: 'admin'}
                lean: true,
                offset: parseInt( request.body.from ),
                limit: parseInt( request.body.to )
            };

            return Rooms.paginate( query, options ).then( function ( result ) {
                result.docs.filter( function ( item, key ) {
                    if ( item.user == null ) {
                        delete result.docs[ key ];
                    }
                } );

                resolve( result );
            }, function ( err ) {
                resolve( err ? { errorMessage: err.message } : true );
            } );
        } );
    }

    /**
     *
     * @param request
     * @returns {Promise}
     */
    function deleteRoom( request ) {
        return new Promise(
            resolve => {
                return Rooms.remove( { _id: request.params.id },
                    err => {
                        if ( err ) {
                            resolve( { errorMessage: err.message } );
                        }

                        async.forEachOf( mongoose.connection.collections, ( collection, collectionName, done ) => {
                            if ( collectionName.indexOf( 'msg_' + request.params.id ) > -1 ) {
                                collection.drop( err => {
                                    if ( err && err.message !== 'ns not found' ) {
                                        done( err );
                                    } else {
                                        done( null );
                                        resolve( true );
                                    }
                                } );
                            }
                        } );
                    } );
            } );
    }

    /**
     *
     * @param request
     * @param lang
     * @returns {Promise}
     */
    function addRoom( request, lang ) {
        return new Promise( function ( resolve ) {
            request.body.language = lang || 'en';
            return Rooms.create( request.body, ( err, doc ) => {
                if ( err ) {
                    resolve( { errorMessage: err.message } );
                } else {
                    require( '../../models/messenger' )( [ doc._id ] );
                    resolve( doc );
                }

            } );
        } );
    }

    /**
     *
     * @param request
     * @returns {Promise}
     */
    function updateRoom( request ) {
        return new Promise( function ( resolve ) {
            return Rooms.findOneAndUpdate( { _id: request.body._id }, request.body,
                ( err, doc ) => {
                    if ( err ) {
                        resolve( { errorMessage: err.message } );
                    } else {
                        require( '../../models/messenger' )( [ doc._id ] );
                        resolve( request.body );
                    }
                } );
        } );
    }

    /**
     *
     * @param request
     * @param mode
     * @returns {Promise}
     */
    function updateRoomStatus( request, mode ) {
        return new Promise( function ( resolve ) {
            if ( mode === 'update' ) {
                return Rooms.findOneAndUpdate( { _id: request.body.room }, {
                        updatedBy: request.body.user,
                        lastMessage: request.body.message,
                        $inc: { messageCount: 1 }
                    },
                    ( err, doc ) => {
                        if ( err ) {
                            resolve( { errorMessage: err.message } );
                        } else {
                            require( '../../models/messenger' )( [ doc._id ] );
                            resolve( true );
                        }

                    } );
            }
            if ( mode === 'delete' ) {
                return Rooms.findOneAndUpdate( { _id: request.params.room }, {
                        $inc: { messageCount: -1 }
                    },
                    err => {
                        if ( err ) {
                            resolve( { errorMessage: err.message } );
                        } else {
                            resolve( true );
                        }

                    } );
            }
        } );
    }

    /**
     *
     * @param request
     * @returns {Promise.<Boolean>}
     */
    async function checkDupe( request, lang ) {
        return await getRoomById( request.body.room, lang ).then( roomData => roomData.lastMessage === request.body.message );
    }

    /**
     *
     * @param request
     * @returns {Promise}
     */
    function addMember( request ) {
        return new Promise( function ( resolve ) {
            Rooms.findOneAndUpdate(
                { _id: request.body.room, members: { $ne: request.body.member } },
                {
                    $push: {
                        'members': request.body.member
                    }
                },
                function onSuccess( err ) {
                    resolve( err ? { errorMessage: err.message } : true );
                } );
        } );
    }

    /**
     *
     * @param request
     * @returns {Promise}
     */
    function removeMember( request ) {
        return new Promise( function ( resolve ) {
            Rooms.findOneAndUpdate(
                { _id: request.body.room, members: request.body.member },
                {
                    $pull: {
                        'members': request.body.member
                    }
                },
                function onSuccess( err ) {
                    resolve( err ? { errorMessage: err.message } : true );
                } );
        } );
    }


    /**
     *
     * @param req
     * @returns {Promise}
     */
    function getNews( req ) {
        return new Promise( function ( resolve ) {

                const hasRoom = async ( news ) => {
                    if ( news && news.hasOwnProperty( 'data' ) && news.data.articles ) {
                        let item;
                        await Promise.all( Object.keys( news.data.articles ).map( async ( key ) => {
                            item = news.data.articles[ key ];
                            if ( item && item.title ) {
                                const titleNorm = Utils.removeDiacritics( item.title );
                                item[ 'hasRoom' ] = await getRoomByTitle( titleNorm ).then( result => !!result );
                            }
                        } ) );
                        return news;
                    } else {
                        return news || { articles: {} };
                    }
                };

                let updateDate = function () {
                    News.findOneAndUpdate( { category: req.category, language: req.language }, { createdAt: Date.now() } );
                };

                News.findOne( { category: req.category, language: req.language } ).lean().exec( function ( err, newsFeed ) {
                    if ( err ) {
                        resolve( { errorMessage: err.message } );
                    }

                    let itsTimeToRefreshNews = null;

                    if ( newsFeed ) {
                        let storedDate = new Date( newsFeed.createdAt ).getTime();
                        let newDate = new Date().getTime();
                        let diff = ( newDate - storedDate );
                        itsTimeToRefreshNews = diff / 1000 / 60 / 30;
                    }

                    if ( itsTimeToRefreshNews > 1 || !newsFeed ) {
                        var options = {
                            method: 'post',
                            body: req,
                            json: true,
                            timeout: 5000,
                            url: Constants.newsApi.apiServer
                        };

                        return Request( options, function ( err, res, body ) {
                            if ( body ) {
                                body.createdAt = Date.now();
                                News.findOneAndUpdate(
                                    { category: req.category, language: req.language },
                                    body,
                                    {
                                        upsert: true, new: true, runValidators: true
                                    }, function ( err ) {
                                        hasRoom( body ).then( function ( articles ) {
                                            resolve( err ? { errorMessage: err.message } : articles );
                                        } );
                                    } );
                            } else {
                                //there is no body, so we sending back the stored collection or an empty object if it`s not exit
                                hasRoom( newsFeed ).then( function ( articles ) {
                                    updateDate();
                                    resolve( newsFeed ? articles : {} );
                                } );
                            }
                        } );
                    } else {
                        //there is a feed and no need to update, so we sending back the stored collection or an error message if something goes wrong
                        hasRoom( newsFeed ).then( function ( articles ) {
                            resolve( err ? { errorMessage: err.message } : articles );
                        } );

                    }

                } );
            }
        );
    }

    return {
        getFeaturedRooms: getFeaturedRooms,
        getHotRooms: getHotRooms,
        getNewRooms: getNewRooms,
        getFavoriteRooms: getFavoriteRooms,
        getPrivateRooms: getPrivateRooms,
        getAllRoomsId: getAllRoomsId,
        getRoomById: getRoomById,
        getRoomByTitle: getRoomByTitle,
        getRoomsByPage: getRoomsByPage,
        addRoom: addRoom,
        updateRoom: updateRoom,
        updateRoomStatus: updateRoomStatus,
        deleteRoom: deleteRoom,
        checkDupe: checkDupe,
        addMember: addMember,
        removeMember: removeMember,
        getNews: getNews
    };
} )
();

module.exports = RoomService;
