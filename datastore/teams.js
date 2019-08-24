/**
 * Teams getter
 */

const db = require('./datastore');

const ENTITY_NAME = 'Team';

/**
 * Get all teams
 */
exports.getAllTeams = async function() {
    const query = db.createQuery(ENTITY_NAME);

    const [teams] = await db.runQuery(query);
    return teams;
};