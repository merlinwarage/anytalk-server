var mongoose = require('mongoose');
mongoose.Promise = Promise;

const Schema = mongoose.Schema;
const Constants = require('../common/constants');
const mongoosePaginate = require('../common/mongoose-paginate');

var roomSchemas = {};

module.exports = function ( rooms ) {
    if (rooms) {
        rooms.forEach(function ( roomId ) {
            if (!roomSchemas.hasOwnProperty(roomId)) {
                var ModelSchema = new Schema(
                    {
                        user: {type: String, required: true, ref: 'Users'},
                        message: {type: String, required: true},
                        replyTo: {_id: {type: String}, name: {type: String}},
                        upVote: {type: Number, default: 0},
                        downVote: {type: Number, default: 0},
                        __vendorData: {type: Object, default: null}
                    },
                    {timestamps: true}
                );

                ModelSchema.index({id_: 1, user: 1}, {sparse: true});
                ModelSchema.index({message: 'text'});
                ModelSchema.plugin(mongoosePaginate);

                var Model = mongoose.model('msg_' + roomId, ModelSchema);

                Model.ensureIndexes(function ( err ) {
                    if (err) throw err;
                });
                Model.on('index', function ( err ) {
                    if (err) console.error(err); // error occurred during index creation
                });

                roomSchemas[roomId] = Model;
            }
        });
    }
    return roomSchemas;
};