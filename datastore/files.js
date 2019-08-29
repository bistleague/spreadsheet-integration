/**
 * Files getter
 */

const db = require('./datastore');

const ENTITY_NAME = 'File';

/**
 * Get file by ID
 */
async function get(id) {
    if(!id) {
        return;
    }

    const key = db.key([ENTITY_NAME, id]);
    const file = await db.get(key);
    return file[0];
};

/**
 * 
 */
exports.getAllFiles = async function(data) {
    if(!data) {
        return;
    }

    for (var obj of data) {
        if(obj.poe_file_id) {
            obj.poe_file = await get(obj.poe_file_id);
        }
        if(obj.student_id_file_id) {
            obj.student_id_file = await get(obj.student_id_file_id);
        }
        if(obj.proof_of_payment_file_id) {
            obj.proof_of_payment_file = await get(obj.proof_of_payment_file_id);
        }
        if(obj.preliminary_submission_file_id) {
            obj.preliminary_submission_file = await get(obj.preliminary_submission_file_id);
        }
        if(obj.semifinal_submission_file_id) {
            obj.semifinal_submission_file = await get(obj.semifinal_submission_file_id);
        }
    };

    return data;
};