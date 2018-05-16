var mongoose = require('mongoose');
mongoose.Promise = Promise;

const Schema = mongoose.Schema;
const Constants = require('../common/constants');
const mongoosePaginate = require('../common/mongoose-paginate');

var ModelSchema = new Schema({
    title: {
        type: String, required: true, trim: true
    },
    titleNorm: {
        type: String, required: true, trim: true
    },
    language: {
        type: String, required: true, trim: true
    },
    description: {
        type: String, trim: true
    },
    url: {
        type: String, trim: true
    },
    urlToImage: {
        type: String, trim: true
    },
    author: {
        type: String, trim: true
    },
    publishedAt: {
        type: String, trim: true
    },
    type: {
        type: String, required: true, trim: true
    },
    category: {
        type: String, trim: true
    },
    messageCount: {
        type: Number, default: 0
    },
    user: {
        type: String, required: true, ref: 'Users', trim: true
    },
    updatedBy: {
        type: String, ref: 'Users', trim: true
    },
    lastMessage: {
        type: String
    },
    featured: {
        type: Boolean, default: false
    },
    private: {
        type: Boolean, default: false
    },
    members: [{
        type: String, ref: 'Users'
    }],
    closed: {
        type: Boolean, default: false
    }

}, {
    timestamps: true
});

ModelSchema.index({id_: 1}, {sparse: true});
ModelSchema.index({titleNorm: 1, language: 1, category: 1, private: 1}, {unique: true});
ModelSchema.index({title: 'text'});
ModelSchema.plugin(mongoosePaginate);

var Model = mongoose.model('message_rooms', ModelSchema);

/* remove from production */
if (Constants.system.envType === 'dev') {
    Model.ensureIndexes(function (err) {
        if (err) throw err;
    });
    Model.on('index', function (err) {
        if (err) console.error(err); // error occurred during index creation
    });
}

module.exports = Model;