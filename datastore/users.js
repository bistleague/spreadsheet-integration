/**
 * Users getter
 */

const db = require('./datastore');

const ENTITY_NAME = 'User';

/**
 * Get all users
 */
exports.getAllUsers = async function() {
    const query = db.createQuery(ENTITY_NAME);

    const [users] = await db.runQuery(query);
    return users;
};