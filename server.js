'use strict';
// Dependencies
const express = require( 'express' );
const app = express();
const http = require( 'http' );
const sio = require( 'socket.io' );
const compression = require( 'compression' );
const mongoose = require( 'mongoose' );
const bodyParser = require( 'body-parser' );
const cookieParser = require( 'cookie-parser' );
const flash = require( 'connect-flash' );
const morgan = require( 'morgan' );
const session = require( 'express-session' );
const mongoDBStore = require( 'connect-mongodb-session' )( session );
const helmet = require( 'helmet' );
const assert = require( 'assert' );
const timeout = require( 'connect-timeout' );

const constants = require( './app/common/constants' );
const cluster = false; //require('cluster');

if ( cluster && cluster.isMaster ) {
    const numWorkers = require( 'os' ).cpus().length;

    console.log( 'Master cluster setting up ' + numWorkers + ' workers...' );

    for ( let i = 0; i < numWorkers; i++ ) {
        cluster.fork();
    }

    cluster.on( 'online', worker => {
        console.log( 'Worker ' + worker.process.pid + ' is online' );
    } );

    cluster.on( 'exit', ( worker, code, signal ) => {
        console.log( 'Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal );
        console.log( 'Starting a new worker' );
        cluster.fork();
    } );
} else {

// Variables
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneYear = 365 * oneDay;

// Configs
    const db = require( './config/db' );

    const haltOnTimedout = ( req, res, next ) => {
        if ( !req.timedout ) next();
    };

    app.use( timeout( 120000 ) );
    app.use( haltOnTimedout );

// Connect to the DB
    const options = {
        keepAlive: 300000,
        connectTimeoutMS: 30000,
        auto_reconnect: true,
        reconnectTries: Number.MAX_VALUE,
        config: { autoIndex: false },
        useNewUrlParser: true
    };
    mongoose.connect( db.url, options );


// CONNECTION EVENTS
// When successfully connected
    mongoose.connection.on( 'connected', () => {
        console.log( 'Mongoose default connection open to ' + db.url );
    } );

// If the connection throws an error
    mongoose.connection.on( 'error', ( err ) => {
        console.log( 'Mongoose default connection error: ' + err );
        mongoose.disconnect();
    } );

// When the connection is disconnected
    mongoose.connection.on( 'disconnected', () => {
        console.log( 'Mongoose default connection disconnected' );
        mongoose.connect( db.url, options );
    } );

// If the Node process ends, close the Mongoose connection
    process.on( 'SIGINT', () => {
        mongoose.connection.close( () => {
            console.log( 'Mongoose default connection disconnected through app termination' );
            process.exit( 0 );
        } );
    } );

// HTTP
    app.use( ( req, res, next ) => {
        if ( req.headers.origin ) {
            const allowedOrigins = [
                /merlinw.org/,
                /inst.hu/,
                /localhost/,
                /anytalk.hu/
            ];
            const origin = req.headers.origin;
            const originCheck = origin => !!allowedOrigins.some( allowed => origin.match( allowed ) );
            if ( originCheck( origin ) ) res.setHeader( 'Access-Control-Allow-Origin', origin );

        }
        res.setHeader( 'Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE' );
        res.setHeader( 'Access-Control-Allow-Headers', 'X-Requested-With,content-type,X-Auth-Token,X-Language' );
        res.setHeader( 'Access-Control-Allow-Credentials', true );
        next();
    } );

// Trust first proxy
    app.set( 'trust proxy', 'loopback' );

// Session, Cookie
    const store = new mongoDBStore(
        {
            uri: db.url,
            collection: 'session',
            auto_reconnect: true
        } );

    store.on( 'error', error => {
        assert.ifError( error );
        assert.ok( false );
    } );

    app.use( session( {
        secret: 'bf1e-5c3d-84ca-642c37708daf',
        cookie: {
            httpOnly: true,
            secure: true,
            proxy: true,
            maxAge: oneWeek
        },
        store: store,
        resave: true,
        saveUninitialized: true
    } ) );

// For parsing HTTP responses
    app.use( bodyParser.json( { limit: '50mb' } ) );
    app.use( bodyParser.urlencoded( { extended: false } ) );
    app.use( cookieParser() );

// Security
    app.use( helmet() );
    app.use( helmet.xssFilter( { setOnOldIE: true } ) );
    app.use( helmet.frameguard( 'deny' ) );
    app.use( helmet.hsts( { maxAge: 7776000000, includeSubDomains: true } ) );
    app.use( helmet.hidePoweredBy() );
    app.use( helmet.ieNoOpen() );
    app.use( helmet.noSniff() );
    app.use( helmet.noCache() );
    app.use( compression() );
    app.disable( 'x-powered-by' );

// log every request to the console
    app.use( morgan( constants.system.envType ) );
    app.use( flash() );

// To expose public assets to the world
    app.use( express.static( __dirname + '/public/build/', { maxAge: oneYear } ) );

    const httpServer = http.createServer( app );
    const io = sio.listen( httpServer );
    httpServer.listen( 8080 );


// Express Routes
    require( './app/modules/socket/socket.controller' )( io );
    require( './app/modules/user/user.controller' )( app );
    require( './app/modules/user/auth.controller.js' )( app );
    require( './app/modules/messenger/room.controller' )( app );
    require( './app/modules/messenger/messenger.controller' )( app );

    process.on( 'SIGINT', () => {
        mongoose.connection.close( () => {
            console.log( 'Mongoose default connection disconnected through app termination' );
            process.exit( 0 );
        } );
    } );
}

/* unused configs
 const parseurl = require("parseurl");

 app.use(bodyParser.urlencoded({limit: "50mb", extended: true}));
 app.use(bodyParser.raw({limit: "50mb", type: "application/octet-stream"}));
 http.globalAgent.maxSockets = 50;
 require("events").EventEmitter.prototype._maxListeners = 1000;
 */
