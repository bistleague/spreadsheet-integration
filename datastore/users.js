/**
 * Users getter
 */

const db = require('./datastore');

const ENTITY_NAME = 'User';

/**
 * Get all users
 */
exports.getAllUsers = async function() {
    const query = db.createQuery(ENTITY_NAME).order('created_time', {
      descending: false,
    });

    const [users] = await db.runQuery(query);
    return users;
};