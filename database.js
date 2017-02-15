const admin = require('firebase-admin');

const serviceAccount = require('./memeline.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

module.exports = admin.database()
