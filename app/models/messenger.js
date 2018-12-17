const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const mongoosePaginate = require( '../common/mongoose-paginate' );

mongoose.Promise = Promise;

let roomSchemas = {};

module.exports = function ( rooms ) {
    if ( rooms ) {
        rooms.forEach( roomId => {
            if ( !roomSchemas.hasOwnProperty( roomId ) ) {
                const ModelSchema = new Schema(
                    {
                        user: { type: String, required: true, ref: 'Users' },
                        message: { type: String, required: true },
                        replyTo: { _id: { type: String }, name: { type: String } },
                        upVote: { type: Number, default: 0 },
                        downVote: { type: Number, default: 0 },
                        __vendorData: { type: Object, default: null }
                    },
                    { timestamps: true }
                );

                ModelSchema.index( { id_: 1, user: 1 }, { sparse: true } );
                ModelSchema.index( { message: 'text' } );
                ModelSchema.plugin( mongoosePaginate );

                const Model = mongoose.model( 'msg_' + roomId, ModelSchema );

                Model.createIndexes( err => {
                    if ( err ) throw err;
                } );
                Model.on( 'index', err => {
                    if ( err ) console.error( err ); // error occurred during index creation
                } );

                roomSchemas[ roomId ] = Model;
            }
        } );
    }
    return roomSchemas;
};
