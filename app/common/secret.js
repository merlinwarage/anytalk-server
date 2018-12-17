'use strict';
const crypto = require( 'crypto' );
const algorithm = 'aes-256-ctr';
const password = '51d687c220747e28681ee659f6e04d98b21b87b583e3dc3c';

const Secret = ( function () {
    async function encrypt( text ) {
        const cipher = await crypto.createCipher( algorithm, password );
        let crypted = await cipher.update( text, 'utf8', 'hex' );
        return await ( crypted + cipher.final( 'hex' ) );
    }

    async function decrypt( text ) {
        const decipher = await crypto.createDecipher( algorithm, password );
        let dec = await decipher.update( text, 'hex', 'utf8' );
        return await ( dec + decipher.final( 'utf8' ) );
    }

    return {
        encrypt: encrypt,
        decrypt: decrypt
    };
} )();

module.exports = Secret;
