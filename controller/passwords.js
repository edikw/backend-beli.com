import { createCipher, createDecipher } from 'crypto';

var decrypts = {
    decrypt : function(text) {
        let mykey = createCipher('aes-128-cbc', 'text');
        let mystr = mykey.update(text, 'utf8', 'hex')
        mystr += mykey.final('hex');
        return mystr;
    },
    encrypt: function(text) {
        let mykey = createDecipher('aes-128-cbc', 'text');
        let mystr = mykey.update(text, 'hex', 'utf8')
        mystr += mykey.final('utf8');
        return mystr
    }
}

export default decrypts