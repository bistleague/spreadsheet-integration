const {Datastore} = require('@google-cloud/datastore');

const datastore = new Datastore({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GCP_DATASTORE_CREDENTIALS_JSON_PATH,
});

module.exports = datastore;