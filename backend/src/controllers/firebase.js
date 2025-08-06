const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://feat-63kty-default-rtdb.firebaseio.com' // URL de tu proyecto Feat
  });
}

const db = admin.database();
module.exports = db;