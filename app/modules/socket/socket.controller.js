var userList = {};
var defaultRoom = 'defaults';
userList[defaultRoom] = {};

module.exports = function (io) {
    io.sockets.on('connection', function (socket) {

        socket.room = defaultRoom;

        //User Data transfer
        socket.on('user:join', function (userData) {
            if (socket.room && socket.room != userData.room) {
                socket.leave(socket.room);
            }

            socket.room = userData.room;
            socket.join(userData.room);

            socket.userData = userData;
            if (!userList[socket.room]) {
                userList[socket.room] = {};
            }
            userList[socket.room][userData.userId] = userData;
            updateUserlist()
        });

        socket.on('user:left', function (userId) {
            delete userList[socket.room][userId];
            updateUserlist();
        });

        socket.on('disconnect', function () {
            if (socket.userData && socket.userData.hasOwnProperty('userId')) {
                delete userList[socket.room][socket.userData.userId];
                updateUserlist();
            }
        });

        var updateUserlist = function () {
            io.to(socket.room).emit('user:update', userList);
        };

        var sendMessages = function (data) {
            io.sockets.in(data.room).emit('send:message', {
                _id: data._id,
                room: data.room,
                userId: data.userId,
                userName: data.userName,
                message: data.message,
                replyTo: {
                    _id: data.replyTo._id,
                    name: data.replyTo.name
                },
                createdAt: data.createdAt
            });
        };

        //Message Data transfer
        socket.on('send:message', function (data) {
            sendMessages(data);
        });

    });
};