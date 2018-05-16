'use strict';
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = '51d687c220747e28681ee659f6e04d98b21b87b583e3dc3c';

var Secret = (function () {
    function encrypt( text ) {
        return new Promise(function ( resolve ) {
            var cipher = crypto.createCipher(algorithm, password);
            var crypted = cipher.update(text, 'utf8', 'hex');
            crypted += cipher.final('hex');
            resolve(crypted);
        });
    }

    function decrypt( text ) {
        return new Promise(function ( resolve ) {
            var decipher = crypto.createDecipher(algorithm, password);
            var dec = decipher.update(text, 'hex', 'utf8');
            dec += decipher.final('utf8');
            //assert.equal(decText, secret);
            resolve(dec);
        });
    }

    return {
        encrypt: encrypt,
        decrypt: decrypt
    };
})();

module.exports = Secret;