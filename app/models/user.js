var mongoose = require('mongoose');
mongoose.Promise = Promise;

const Schema = mongoose.Schema;
const Constants = require('../common/constants');

var ModelSchema = new Schema({
    name: {
        type: String, required: true, trim: true
    },
    mail: {
        type: String, required: true, trim: true
    },
    password: {
        type: String, required: true, trim: true
    },
    permission: {
        type: Number, default: 1
    },
    lastMessage: {
        type: String
    },
    activities: {
        up: {
            type: Array, default: []
        },
        down: {
            type: Array, default: []
        },
        favorites: {
            type: Array, default: []
        }
    },
    deleted: {
        type: Boolean, default: false
    }
}, {
    timestamp: true
});

ModelSchema.index({id_: 1}, {sparse: true});
ModelSchema.index({mail: 1}, {unique: true});
ModelSchema.index({name: 1}, {unique: true});

var Model = mongoose.model('Users', ModelSchema);

if (Constants.system.envType === 'dev') {
    Model.ensureIndexes(function (err) {
        if (err) return handleError(err);
    });
    Model.on('index', function (err) {
        if (err) console.error(err); // error occurred during index creation
    });
}

module.exports = Model;