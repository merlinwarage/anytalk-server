'use strict';

const Constants = require( '../../common/constants' );
const Request = require( 'request' );
const fs = require( 'fs' );
const path = require( 'path' );
const url = require( 'url' );
const Feed = require( 'rss-to-json' );
const Sharp = require( 'sharp' );

const noImage = Constants.defaults.noImagePath;

const MaintainerService = ( () => {

        const tempDir = './tmp';
        const tempDirPath = 'tmp/';

        const options = {
            dontFetchImages: false,
            language: 'hu',
            category: '',
            itemCount: 0
        };

        /**
         * public
         * @param language
         * @param category
         * @param itemCount
         * @returns {Promise}
         */
        function newsFeed( language, category, itemCount, noImage ) {

            deleteDirContent( Constants.defaults.imageAbsPath + tempDirPath );

            options.language = language;
            options.category = category;
            options.itemCount = itemCount;
            options.dontFetchImages = noImage;

            return new Promise( function ( resolve ) {
                switch ( options.language ) {
                    case Constants.languages.hu_HU: {
                        getNewsHu( options.category ).then(
                            async articles => resolve( buildArticleList( articles, options ) ),
                            err => resolve( err )
                        );
                        break;
                    }
                    case Constants.languages.en_GB: {
                        getNewsEn( options.category ).then(
                            async articles => resolve( buildArticleList( articles, options ) ),
                            err => resolve( err )
                        );
                        break;
                    }
                }
            } );
        }

        async function buildArticleList( articles, { itemCount, category } ) {
            let articleList = [];
            if ( !itemCount && articles.articles ) {
                itemCount = articles.articles.length;
            }
            if ( articles && articles.hasOwnProperty( 'articles' ) ) {
                await Promise.all( articles.articles.map( async item => {
                    await imageHandler( item, category ).then( newItem => {
                        item = newItem;
                        if ( item.title && articleList.length <= itemCount ) {
                            articleList.push( item );
                        }
                    } );
                } ) );

                return { articles: articleList };
            } else {
                return false;
            }
        }

        /**
         *
         * @param category
         * @returns {Promise}
         */
        function getNewsEn( category ) {
            return new Promise( function ( resolve ) {

                const options = {
                    url: Constants.newsApi.apiUrl, qs: {
                        source: Constants.sourceListEn[ category ].source,
                        sortBy: Constants.sourceListEn[ category ].sortBy,
                        apiKey: Constants.newsApi.apiKey
                    },
                    timeout: 5000
                };

                function callback( error, response, body ) {
                    if ( !error && response.statusCode == 200 ) {
                        resolve( JSON.parse( body ) );
                    } else {
                        resolve( { articles: {} } );
                    }
                }

                Request( options, callback );
            } );
        }


        /**
         *
         * @param category
         * @returns {Promise}
         */
        function getNewsHu( category ) {
            return new Promise( function ( resolve ) {
                Feed.load( Constants.sourceListHu[ category ].source, function ( err, rss ) {
                    if ( !err ) {
                        resolve( convertFeed( rss ) );
                    }
                } );
            } );
        }

        async function getImageUrl( enclosures ) {
            if ( Array.isArray( enclosures ) ) {
                for ( let index in enclosures ) {
                    return await enclosures[ index ].url ? enclosures[ index ].url : noImage;
                }
            } else {
                return noImage;
            }
        };

        async function convertFeed( jsonFeed ) {
            let articles = [];

            for ( let key in jsonFeed.items ) {
                if ( jsonFeed.items.hasOwnProperty( key ) ) {
                    let item = jsonFeed.items[ key ];
                    let complete = true;
                    let isoDate;
                    let imageUrl = noImage;

                    !item.hasOwnProperty( 'title' )
                        ? complete = false
                        : null;

                    !item.hasOwnProperty( 'created' )
                        ? complete = false
                        : isoDate = new Date( item.created ).toISOString();

                    //remove html content
                    !item.hasOwnProperty( 'description' ) && typeof item.description === 'string'
                        ? complete = false
                        : item.description = item.description.replace( /<(.*?)\/>/g, '' ).replace( /<(.*?)\/>/g, '' );

                    /**
                     * @param {{enclosures:string}} item
                     */
                    await getImageUrl( item.enclosures ).then( result => {
                        imageUrl = result;
                        if ( complete ) {
                            articles.push( {
                                title: item.title,
                                description: item.description,
                                url: item.url,
                                urlToImage: imageUrl,
                                publishedAt: isoDate
                            } );
                        }
                    } );
                }
            }

            return { articles: articles.sort( ( a, b ) => b.publishedAt - a.publishedAt ) };
        }


        /**
         *
         * @param item
         * @param category
         * @returns {Promise}
         */
        function imageHandler( item, category ) {
            return new Promise( function ( resolve ) {
                if ( item.urlToImage && category && !options.dontFetchImages ) {
                    let localImage = getPathFromUrl( item.urlToImage.substring( item.urlToImage.lastIndexOf( '/' ) + 1 ) );

                    //check blacklist
                    for ( let blacklistedImage in Constants.newsApi.blacklist ) {
                        if ( item.urlToImage.indexOf( Constants.newsApi.blacklist[ blacklistedImage ] ) !== -1 ) {
                            item.urlToImage = noImage;
                            resolve( item );
                            return;
                        }
                    }

                    /**
                     * check if image is already downloaded
                     * @param {{existsSync:function}} item
                     */

                    if ( fs.existsSync( Constants.defaults.imageAbsPath + localImage ) ) {
                        item.urlToImage = ( getFilesizeInBytes( Constants.defaults.imageAbsPath + localImage ) > 1000 ) ? Constants.defaults.imageRelPath + localImage : noImage;
                        resolve( item );
                    } else {
                        //save the image and load the local one... if everything went well... otherwise load the default placeholder image
                        saveNews( item.urlToImage ).then( async function ( uploadResult ) {
                                await checkFile( localImage, uploadResult ).then( ( result ) => {
                                    item.urlToImage = result;
                                    resolve( item );
                                } );
                            }, function () {
                                item.urlToImage = noImage;
                                resolve( item );
                            }
                        );
                    }
                } else {
                    //broken response or feed
                    item.urlToImage = noImage;
                    resolve( item );
                }
            } );
        }

        async function checkFile( localImage, uploadResult ) {
            try {
                const exist = await fs.existsSync( Constants.defaults.imageAbsPath + localImage );
                const size = await getFilesizeInBytes( Constants.defaults.imageAbsPath + localImage ) > 1000;
                return await ( exist && uploadResult.statusCode === 200 && size ) ? Constants.defaults.imageRelPath + localImage : noImage;
            } catch ( e ) {
                console.log( e );
                return noImage;
            }

        }

        /**
         *
         * @param fileUrl
         * @returns {Promise}
         */
        function saveNews( fileUrl ) {
            return new Promise( async function ( resolve ) {

                    /**
                     *
                     * @param uri
                     * @param filename
                     * @param callback
                     * @returns {*}
                     */
                    let download = function ( uri, filename, callback ) {
                        try {
                            /**
                             * @param {{createWriteStream:function}} fs
                             */
                            if ( filename && filename.match( /(.jpg|.jpeg|.png|.gif|.bmp)/ ) ) {
                                let fstream = fs.createWriteStream( filename );
                                return Request.head( uri, async function ( e, res ) {
                                    return await Request( uri ).pipe( fstream )
                                        .on( 'close', callback )
                                        .on( 'error', function () {
                                            fstream.on( 'error', function ( e ) {
                                                console.log( 'ERROR:' + e );
                                                res.status( 200 ).send( e.errorMessage );
                                            } );
                                        } );
                                } );
                            } else {
                                return Constants.defaults.noImagePath;
                            }
                        } catch ( err ) {
                            return fileName;
                        }
                    };

                    let URL = url.parse( fileUrl );
                    let fileName = URL.pathname.substring( URL.pathname.lastIndexOf( '/' ) + 1 ).replace( /((\?|#).*)?$/, '' );

                    if ( !fs.existsSync( Constants.defaults.imageAbsPath + tempDir ) ) {
                        fs.mkdirSync( Constants.defaults.imageAbsPath + tempDir );
                    }
                    await download( fileUrl, Constants.defaults.imageAbsPath + tempDirPath + fileName, async ( err ) => {
                        await Sharp( Constants.defaults.imageAbsPath + tempDirPath + fileName )
                            .resize( 280 )
                            .toFile( Constants.defaults.imageAbsPath + fileName, async function ( err ) {
                                await resolve( err ? err : { statusCode: 200 } );
                            } );
                    } );
                }
            );
        }

        /**
         *
         * @param url
         * @returns {*}
         */
        function getPathFromUrl( url ) {
            return url.split( /[?#]/ )[ 0 ];
        }

        /**
         * @param filename
         */
        function getFilesizeInBytes( filename ) {
            /**
             * @param {{statSync:function}} fs
             */
            try {
                return fs.statSync( filename )[ 'size' ];
            } catch ( e ) {
                throw e;
            }
        }

        function deleteDirContent( dir ) {
            fs.readdir( dir, ( err, files ) => {
                if ( err ) throw err;
                for ( const file of files ) {
                    fs.unlink( path.join( dir, file ), err => {
                        if ( err ) console.log( err );
                    } );
                }
            } );
        }

        return {
            newsFeed: newsFeed
        };
    }

)
();

module.exports = MaintainerService;
