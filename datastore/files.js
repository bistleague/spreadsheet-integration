/**
 * Files getter
 */

const db = require('./datastore');

const ENTITY_NAME = 'File';

module.exports.getAll = async function() {
  const query = db.createQuery(ENTITY_NAME);

  const [files] = await db.runQuery(query);
  return files;
};