'use strict';
// Dependencies
const express = require( 'express' );
const app = express();
const bodyParser = require( 'body-parser' );
const flash = require( 'connect-flash' );
const morgan = require( 'morgan' );
const timeout = require( 'connect-timeout' );
const cluster = false; //require('cluster');

const constants = require( './app/common/constants' );

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

// Configs
    const haltOnTimedout = ( req, res, next ) => {
        if ( !req.timedout ) next();
    };

    app.use( timeout( 120000 ) );
    app.use( haltOnTimedout );

// HTTP
    app.use( ( req, res, next ) => {
        const allowedOrigins = [
            'http://localhost'
        ];
        const origin = req.headers.origin;
        if ( allowedOrigins.indexOf( origin ) > -1 ) {
            res.setHeader( 'Access-Control-Allow-Origin', origin );
        }
        res.setHeader( 'Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE' );
        res.setHeader( 'Access-Control-Allow-Headers', 'X-Requested-With,content-type' );
        res.setHeader( 'Access-Control-Allow-Credentials', true );
        next();
    } );

// Trust first proxy
    app.set( 'trust proxy', 'loopback' );

// For parsing HTTP responses
    app.use( bodyParser.json( { limit: '50mb' } ) );
    app.use( bodyParser.urlencoded( { extended: false } ) );

// log every request to the console
    app.use( morgan( constants.system.envType ) );
    app.use( flash() );

    const http = require( 'http' ).Server( app );
    http.listen( 8000, () => {
        console.log( 'Process ' + process.pid + ' is listening on 8000 to all incoming requests' );
    } );
    // cluster END
    // }

// Express Routes
    require( './app/modules/maintainer/maintainer.controller' )( app );
}
