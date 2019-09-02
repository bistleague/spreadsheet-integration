/**
 * Teams getter
 */

const db = require('./datastore');

const ENTITY_NAME = 'Team';

/**
 * Get all teams
 */
exports.getAllTeams = async function() {
    const query = db.createQuery(ENTITY_NAME).order('created_time', {
      descending: false,
    });

    const [teams] = await db.runQuery(query);
    return teams;
};