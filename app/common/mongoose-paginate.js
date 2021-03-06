'use strict';

/**
 * @package mongoose-paginate
 * @param {Object} [query={}]
 * @param {Object} [options={}]
 * @param {Object|String} [options.select]
 * @param {Object|String} [options.sort]
 * @param {Array|Object|String} [options.populate]
 * @param {Boolean} [options.lean=false]
 * @param {Boolean} [options.leanWithId=true]
 * @param {Number} [options.offset=0] - Use offset or page to set skip position
 * @param {Number} [options.page=1]
 * @param {Number} [options.limit=10]
 * @param {Function} [callback]
 * @returns {Promise}
 */

const safe = require( 'safe-regex' );

function paginate( query, options, callback ) {

    const escapeRegExp = function ( str ) {
        return str.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
    };

    const replaceAll = function ( str, find, replace ) {
        return str.replace( new RegExp( escapeRegExp( find ), 'g' ), replace );
    };

    query = safe( query ) ? query : {};
    for ( let i in query ) {
        if ( query[ i ].indexOf( '%' ) !== -1 ) {
            query[ i ] = new RegExp( replaceAll( query[ i ], '%', '.*' ), 'ig' );
        }
    }

    options = Object.assign( {}, paginate.options, options );

    let select = options.select;
    let sort = options.sort;
    let populate = options.populate;
    let lean = options.lean || false;
    let leanWithId = options.leanWithId ? options.leanWithId : true;
    let limit = options.limit ? options.limit : 10;
    let page, offset, skip, promises;

    if ( options.offset ) {
        offset = options.offset;
        skip = offset;
    } else if ( options.page ) {
        page = options.page;
        skip = ( page - 1 ) * limit;
    } else {
        page = 1;
        offset = 0;
        skip = offset;
    }

    if ( limit ) {
        let docsQuery = this.find( query )
            .select( select )
            .sort( sort )
            .skip( skip )
            .limit( limit )
            .lean( lean );

        if ( populate ) {
            [].concat( populate ).forEach( ( item ) => {
                docsQuery.populate( item );
            } );
        }

        promises = {
            docs: docsQuery.exec(),
            count: this.count( query ).exec()
        };

        if ( lean && leanWithId ) {
            promises.docs = promises.docs.then( ( docs ) => {
                docs.forEach( ( doc ) => {
                    doc.id = String( doc._id );
                } );
                return docs;
            } );
        }
    }

    promises = Object.keys( promises ).map( ( x ) => promises[ x ] );

    return Promise.all( promises ).then( ( data ) => {
        return new Promise( function ( resolve ) {
            let result = {
                docs: data[ 0 ],
                total: data[ 1 ],
                limit: limit
            };

            if ( offset !== undefined ) {
                result.offset = offset;
            }

            if ( page !== undefined ) {
                result.page = page;
                result.pages = Math.ceil( data.count / limit ) || 1;
            }

            if ( typeof callback === 'function' ) {
                return callback( null, result );
            }

            resolve( result );
        } );
    } );
}

/**
 * @param {Schema} schema
 */

module.exports = function ( schema ) {
    schema.statics.paginate = paginate;
};

module.exports.paginate = paginate;
