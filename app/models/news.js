const Constants = require( '../common/constants' );
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

mongoose.Promise = Promise;

const ModelSchema = new Schema( {
    category: {
        type: String, required: true, trim: true
    },
    language: {
        type: String, required: true, trim: true
    },
    data: {
        type: Object
    },
    createdAt: { type: Date, default: Date.now() }
}, {
    timestamp: true
} );

ModelSchema.index( { id_: 1 }, { sparse: true } );
ModelSchema.index( { category: 1, language: 1 }, { unique: true } );

const Model = mongoose.model( 'News', ModelSchema );

if ( Constants.system.envType === 'dev' ) {
    Model.createIndexes( err => {
        if ( err ) return handleError( err );
    } );
    Model.on( 'index', err => {
        if ( err ) console.error( err );
        // error occurred during index creation
    } );
}

module.exports = Model;
