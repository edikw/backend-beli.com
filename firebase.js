const admin = require('firebase-admin');
const serviceaccount = require('./edikw.json');
admin.initializeApp({
	credential : admin.credential.cert(serviceaccount)
});
const db = admin.firestore();
db.settings({timestampsInSnapshots: true})

module.exports = db;