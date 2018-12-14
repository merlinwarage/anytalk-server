'use strict';

// var mongoose = require('mongoose');
const Promise = require('bluebird');
const UserService = require('../user/user.service');
const RoomService = require('./room.service');
// const async = require('async');
// mongoose.Promise = Promise;
var Messages = {}, rooms = [];

RoomService.getAllRoomsId().then(
    function onSuccess( rooms ) {
        Messages = require('../../models/messenger')(rooms);
    },
    function onError( err ) {
        if (err) {
            return {errorMessage: err.message};
        }
    });

var MessengerService = (function () {

    /**
     *
     * @param room
     */
    function getMessageCount( room ) {
        return new Promise(function ( resolve ) {
            return Messages[room].find({}).countDocuments().lean().exec(function ( err, docs ) {
                resolve(docs);
            }, function ( err ) {
                if (err) {
                    resolve({errorMessage: err.message});
                }
            });
        });
    }

    /**
     *
     * @param room
     */
    function getMessageFirstRecord( room ) {
        return new Promise(function ( resolve ) {
            return Messages[room].findOne({}, {}, {sort: {createdAt: -1}}, function ( err, docs ) {
                resolve(docs);
            });
        });
    }

    /**
     *
     * @param room
     */
    function getMessageLastRecord( room ) {
        return new Promise(function ( resolve ) {
            return Messages[room].findOne({}, {}, {sort: {createdAt: 1}}, function ( err, docs ) {
                resolve(docs);
            });
        });
    }

    /**
     *
     * @param request
     */
    function getAllMessages( request ) {
        return new Promise(function ( resolve ) {
            return Messages[request.params.room].find({}).sort('-_id').populate('user', 'name').lean().exec(function ( err, docs ) {
                resolve(docs);
            }, function ( err ) {
                if (err) {
                    resolve({errorMessage: err.message});
                }
            });
        });
    }

    /**
     *
     * @param request
     */
    function getMessagesByPage( request ) {
        return new Promise(function ( resolve ) {

            //return deleteIndexes().then(function(){

            var query = request.body.query;
            var options = {
                select: {},
                sort: {createdAt: -1},
                populate: [{path: 'user', select: 'name'}], //, match: {name: 'admin'}
                lean: true,
                offset: parseInt(request.body.from),
                limit: parseInt(request.body.to)
            };

            return Messages[request.body.room].paginate(query, options).then(
                function onSuccess( result ) {
                    result.docs.filter(function ( item, key ) {
                        if (item.user == null) {
                            delete result.docs[key];
                        }
                    });

                    resolve(result);
                }, function ( err ) {
                    if (err) {
                        resolve({errorMessage: err.message});
                    }
                });
        });

        // });
    }

    /**
     *
     * @param request
     */
    function getMessageById( request ) {
        return new Promise(function ( resolve ) {
            return Messages[request.params.room].findOne({_id: request.params.id}).populate('user', 'name').lean().exec(function ( err, docs ) {
                resolve(docs);
            }, function ( err ) {
                if (err) {
                    resolve({errorMessage: err.message});
                }
            });
        });
    }

    /**
     *
     * @param request
     */
    function deleteMessage( request ) {
        return new Promise(function ( resolve ) {
            return Messages[request.params.room].remove({
                _id: request.params.id
            }, function onSuccess( err ) {
                if (err) {
                    resolve({errorMessage: err.message});
                }
                resolve(true);
            });
        });
    }

    /**
     *
     * @param request
     */
    function addMessage( request ) {
        return new Promise(function ( resolve ) {
            if (request.body.message.length > 1) {

                let messageData = {
                    user: request.body.user,
                    message: request.body.message,
                    'replyTo._id': request.body.replyToId,
                    'replyTo.name': request.body.replyToName,
                    updatedAt: request.body.updatedAt,
                    createdAt: request.body.createdAt,
                    __vendorData: request.body.__vendorData,
                };

                return Messages[request.body.room].create(messageData,
                    function onSuccess( err, message ) {
                        if (err) {
                            resolve({errorMessage: err.message});
                        }
                        resolve(message);
                    });
            } else {
                resolve(true);
            }
        });
    }

    function setVote( request ) {
        var upVote, downVote;

        if (request.body.vote > 0) {
            upVote = 1;
            downVote = 0;
        } else {
            upVote = 0;
            downVote = 1;
        }

        return new Promise(function ( resolve ) {
            return Messages[request.body.room].findOneAndUpdate(
                {_id: request.body.messageId},
                {$inc: {upVote: upVote, downVote: downVote}},
                function onSuccess( err ) {
                    if (err) {
                        resolve({errorMessage: err.message});
                    }

                    UserService.setActivities(request.body.voteUserId, request.body.messageId, request.body.vote);

                    resolve(true);
                });
        });
    }

    /*
     SG.hu data conversion functions
     */

    function convertReplyEntities( roomId ) {
        return new Promise(function ( resolve ) {
            let subPromise = [];
            return Messages[roomId].find({}).lean().exec(function ( err, docs ) {
                for (let rk in docs) {
                    if (docs.hasOwnProperty(rk) && docs[rk].replyTo && docs[rk].replyTo._id) {
                        for (let mk in docs) {
                            if (docs.hasOwnProperty(mk) && docs[mk].__vendorData && docs[mk].__vendorData.msgId === docs[rk].replyTo._id) {
                                subPromise.push(Messages[roomId].findOneAndUpdate({_id: docs[rk]._id}, {'replyTo._id': docs[mk]._id}, function () {
                                    return true;
                                }));
                            }
                        }
                    }

                    Promise.all(subPromise).then(function () {
                        resolve(true);
                    });
                }
            });
        });
    }

    function createUserEntities( roomId ) {
        return new Promise(function ( resolve ) {

            let subPromise = [];

            let makePasswd = function () {
                var text = '';
                var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

                for (var i = 0; i < 16; i++)
                    text += possible.charAt(Math.floor(Math.random() * possible.length));

                return text;
            };

            return Messages[roomId].find({}).lean().exec(function ( err, docs ) {
                for (let key in docs) {
                    if (docs.hasOwnProperty(key) && docs[key].__vendorData) {
                        let data = {
                            body: {
                                password: makePasswd(),
                                name: docs[key].__vendorData.nick,
                                mail: docs[key].__vendorData.email,
                                permission: 1
                            }
                        };
                        subPromise.push(UserService.addUser(data).then(function () {
                            return true;
                        }));
                    }

                    Promise.all(subPromise).then(function () {
                        resolve(true);
                    });
                }
            });
        });
    }

    function changePlaceholderUsers( roomId ) {
        return new Promise(function ( resolve ) {
            let subPromise = [];
            return UserService.getAllUsers().then(function ( userList ) {
                Messages[roomId].find({user: '58a05db4d5fc7276566bb100'}).select({
                    __vendorData: 1,
                    _id: 1
                }).lean().exec(function ( err, msgDocs ) {
                    for (let mKey in msgDocs) {
                        if (msgDocs.hasOwnProperty(mKey) && msgDocs[mKey].__vendorData) {
                            for (let uKey in userList) {
                                if (userList.hasOwnProperty(uKey)) {
                                    if (msgDocs[mKey].__vendorData.nick === userList[uKey].name) {
                                        subPromise.push(Messages[roomId].findOneAndUpdate({_id: msgDocs[mKey]._id}, {user: userList[uKey]._id}, function () {
                                            return true;
                                        }));
                                    }
                                }
                            }
                        }

                        Promise.all(subPromise).then(function () {
                            resolve(true);
                        });
                    }
                });
            });
        });
    }

    // function deleteIndexes() {
    //     return new Promise(function (resolve) {
    //         async.forEachOf(mongoose.connection.collections, function (collection, collectionName, done) {
    //             if (collectionName.indexOf('msg_') > -1) {
    //                 collection.dropIndex("__vendorData_1", function (err) {
    //                     if (err && err.message != 'ns not found') {
    //                         console.log(collectionName);
    //                         done(err)
    //                     } else {
    //                         console.log('index err');
    //                         done(null);
    //                         resolve(true);
    //                     }
    //                 });
    //             }
    //         });
    //     });
    // }

    return {
        getMessageCount: getMessageCount,
        getMessageFirstRecord: getMessageFirstRecord,
        getMessageLastRecord: getMessageLastRecord,
        getAllMessages: getAllMessages,
        getMessagesByPage: getMessagesByPage,
        getMessageById: getMessageById,
        deleteMessage: deleteMessage,
        addMessage: addMessage,
        setVote: setVote,

        //converter functions
        convertReplyEntities: convertReplyEntities,
        createUserEntities: createUserEntities,
        changePlaceholderUsers: changePlaceholderUsers
    };
})();

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
