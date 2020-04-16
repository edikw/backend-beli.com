const crypto = require('crypto');

var decrypts = {
    decrypt : function(text) {
        let mykey = crypto.createCipher('aes-128-cbc', 'text');
        let mystr = mykey.update(text, 'utf8', 'hex')
        mystr += mykey.final('hex');
        return mystr;
    },
    encrypt: function(text) {
        let mykey = crypto.createDecipher('aes-128-cbc', 'text');
        let mystr = mykey.update(text, 'hex', 'utf8')
        mystr += mykey.final('utf8');
        return mystr
    }
}

module.exports = decrypts