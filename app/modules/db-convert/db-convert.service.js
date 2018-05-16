'use strict';

var mongoose = require('mongoose');
const Rooms = require('../../models/room');
const Messenger = require('../../models/messenger');
const request = require('request');
const Promise = require('bluebird');
const Utils = require('../../common/utils');
const Request = require('request');

const RoomService = require('../messenger/room.service');
const MessengerService = require('../messenger/messenger.service');
const UserService = require('../user/user.service');

mongoose.Promise = Promise;

var DbConvertService = (function () {

    /**
     *
     * @returns {Promise}
     */

    const sgApiKey = '';
    const categories = {
        0: 'general',
        1: 'general',
        2: 'gaming',
        4: 'technology',
        7: 'entertainment',
        9: 'music',
        14: 'science',
        20: 'social',
        25: 'sport'
    };

    function getSgTopic( category, page ) {
        return new Promise(function ( resolve ) {
            var options = {
                url: 'http://sg.hu/api/forum/topics', qs: {
                    category_id: category,
                    page: page,
                    apikey: sgApiKey
                }
            };

            function callback( error, response, body ) {
                if (!error && response.statusCode === 200) {
                    resolve(JSON.parse(body));
                } else {
                    resolve({data: {}});
                }
            }

            Request(options, callback);
        });
    }

    function getSgMessages( topic_id, page, order ) {
        return new Promise(function ( resolve ) {
            var options = {
                url: 'http://sg.hu/api/forum/listing', qs: {
                    topic_id: topic_id,
                    page: page,
                    order: order,
                    apikey: sgApiKey
                }
            };

            function callback( error, response, body ) {
                if (!error && response.statusCode === 200) {
                    resolve(JSON.parse(body));
                } else {
                    resolve({data: {}});
                }
            }

            Request(options, callback);
        });
    }

    function convertRoomData( category, page ) {
        return new Promise(function ( resolve ) {
            let language = 'hu';
            let subPromise = [];
            return getSgTopic(category, page).then(function ( data ) {
                let jsonData = data.msg.normalRows;
                let schema = [];

                for (let key in jsonData) {
                    if (jsonData.hasOwnProperty(key)) {

                        var updated = new Date(jsonData[key].lastrec * 1000);

                        let titleNorm = Utils.removeDiacritics(jsonData[key].title);
                        let roomData = {
                            body: {
                                'category': categories[category],
                                'type': 'forum',
                                'private': false,
                                'featured': false,
                                'closed': false,
                                'title': jsonData[key].title,
                                'language': language,
                                'message': '',
                                'lastMessage': '',
                                'createdAt': updated.toISOString(),
                                'updatedAt': updated.toISOString(),
                                'messageCount': 0,
                                'user': '58a05db4d5fc7276566bb100',
                                'titleNorm': titleNorm
                            }
                        };

                        subPromise.push(RoomService.addRoom(roomData, language).then(function ( result ) {
                            jsonData[key].mwoRoomId = result._id;
                            schema.push(jsonData[key]);
                        }));
                    }

                    Promise.all(subPromise).then(function () {
                        resolve(schema);
                    });
                }
            });
        });
    }

    function getPageCount( topic_id ) {
        return new Promise(function ( resolve ) {
            var order = 'asc';
            return getSgMessages(topic_id, 1, order).then(function ( msgData ) {
                let allPage = msgData.msg.allPage;
                let setPage = allPage >= 5 ? allPage - 5 : 1;
                let pageArr = [];
                for (let i = setPage; i <= allPage; i++) {
                    pageArr.push(i);
                }
                resolve({setPage: setPage, allPage: allPage, pageArr: pageArr});
            });
        });
    }

    function convertMessageData( roomList ) {
        return Promise.map(roomList, function ( room ) {
            return getPageCount(room.id).then(function ( pageData ) {
                Promise.map(pageData.pageArr, function ( page ) {
                    return insertMessages(page, room).then(function () {
                        console.log('insertCaller', page);
                    });
                });
            });
        });
    }

    function insertMessages( page, room ) {
        return new Promise(function ( resolve ) {
            var order = 'asc';
            var subPromises = [];

            return getSgMessages(room.id, page, order).then(function ( data ) {
                let jsonData = data.msg.listing;

                return Promise.map(jsonData, function ( item ) {
                    let replyToId = !item.msg_reply_user_id || item.msg_reply === '0' ? undefined : item.msg_reply;
                    let replyToName = !item.msg_reply_user ? undefined : item.msg_reply_user;
                    let message = item.text.replace(/\[[^\]]*\]/g, '');
                    let dateTime = new Date(item._dateTimeAtom).toISOString();

                    let messageData = {
                        body: {
                            message: message,
                            room: room.mwoRoomId,
                            user: '58a05db4d5fc7276566bb100',
                            replyToId: replyToId,
                            replyToName: replyToName,
                            'createdAt': dateTime,
                            'updatedAt': dateTime,
                            __vendorData: {
                                nick: item.nick,
                                email: item.email,
                                msgId: item.msg_unique
                            }
                        }
                    };

                    subPromises.push(MessengerService.addMessage(messageData));
                    Promise.all(subPromises).then(function ( success ) {
                        resolve(success);
                    });
                });
            });
        });
    }

    function finalizeData( category ) {
        return new Promise(function ( resolve ) {
            let subPromise = [];
            return Rooms.find({category: category}).lean().exec(function ( err, docs ) {
                for (let key in docs) {
                    subPromise.push(MessengerService.getMessageCount(docs[key]._id).then(function ( result ) {
                        Rooms.update({_id: docs[key]._id}, {$set: {messageCount: parseInt(result)}}, function ( err ) {
                            if (err) {
                                console.log(err);
                                return true;
                            } else {
                                return true;
                            }
                        });
                    }));

                    Promise.all(subPromise).then(function () {
                        resolve(true);
                    });
                }
            });
        });
    }

    function roomUserActivities( category ) {
        return new Promise(function ( resolve ) {
            let subPromiseFirst = [];
            let subPromiseLast = [];
            return Rooms.find({category: category}).lean().exec(function ( err, docs ) {
                for (let key in docs) {
                    subPromiseFirst.push(MessengerService.getMessageFirstRecord(docs[key]._id).then(function ( result ) {
                        if (result !== null) {
                            Rooms.update({_id: docs[key]._id}, {
                                $set: {
                                    updatedBy: result.user
                                }
                            }, function () {
                                return true;
                            });
                        }
                    }));

                    subPromiseLast.push(MessengerService.getMessageLastRecord(docs[key]._id).then(function ( result ) {
                        if (result !== null) {
                            Rooms.update({_id: docs[key]._id}, {
                                $set: {
                                    user: result.user,
                                    createdAt: result.createdAt
                                }
                            }, function () {
                                return true;
                            });
                        }
                    }));

                    Promise.all([subPromiseFirst, subPromiseLast]).then(function () {
                        resolve(true);
                    });
                }
            });
        });
    }

    function convertReplyEntities( category ) {
        return new Promise(function ( resolve ) {
            let subPromise = [];
            return Rooms.find({category: category}).lean().exec(function ( err, docs ) {
                for (let key in docs) {
                    subPromise.push(MessengerService.convertReplyEntities(docs[key]._id).then(function ( result ) {
                        return true;
                    }));

                    Promise.all(subPromise).then(function () {
                        resolve(true);
                    });
                }
            });
        });
    }

    function createUserEntities( category ) {
        return new Promise(function ( resolve ) {
            let subPromise = [];
            return Rooms.find({category: category}).lean().exec(function ( err, docs ) {
                for (let key in docs) {
                    subPromise.push(MessengerService.createUserEntities(docs[key]._id).then(function ( result ) {
                        return true;
                    }));

                    Promise.all(subPromise).then(function () {
                        resolve(true);
                    });
                }
            });
        });
    }

    function changePlaceholderUsers( category ) {
        return new Promise(function ( resolve ) {
            let subPromise = [];
            return Rooms.find({category: category}).lean().exec(function ( err, docs ) {
                for (let key in docs) {
                    subPromise.push(MessengerService.changePlaceholderUsers(docs[key]._id).then(function () {
                        console.log(docs[key].titleNorm);
                        return true;
                    }));

                    Promise.all(subPromise).then(function () {
                        resolve(true);
                    });
                }
            });
        });
    }

    return {
        convertRoomData: convertRoomData,
        convertMessageData: convertMessageData,
        finalizeData: finalizeData,
        roomUserActivities: roomUserActivities,
        changePlaceholderUsers: changePlaceholderUsers,
        convertReplyEntities: convertReplyEntities,
        createUserEntities: createUserEntities
    };
})();

module.exports = DbConvertService;