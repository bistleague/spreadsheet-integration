/**
 * Bistleague back-end integration with Google Spreadsheet
 * @author Alfian Maulana Ibrahim
 * @library https://github.com/theoephraim/node-google-spreadsheet
 */

require("dotenv").config();

const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');

const creds = require(process.env.GCP_DATASTORE_CREDENTIALS_JSON_PATH);

const teamsRepository = require('./datastore/teams');
const usersRepository = require('./datastore/users');
const filesRepository = require('./datastore/files');

function translateTeamsStatusesToString(data) {
  // Proof of payment
  if (data.proof_of_payment_verified) {
    data.proof_of_payment_verified = "Verified";
  } else {
    data.proof_of_payment_verified = "Rejected";
    if (data.proof_of_payment_id != null) {
      data.proof_of_payment_verified = "Pending";
    } else {
      data.proof_of_payment_verified = "Not uploaded";
    }
  }
  // Team stage
  if (data.stage === 0) { data.stage = "Registered"; }
  else if (data.stage === 1) { data.stage = "Completed"; }
  else if (data.stage === 2) { data.stage = "Submitted preliminary"; }
  else if (data.stage === 3) { data.stage = "Qualified semifinal"; }
  else if (data.stage === 4) { data.stage = "Submitted semifinal"; }
  else if (data.stage === 5) { data.stage = "Qualified final"; }
  // Files
  if (typeof data.proof_of_payment_file === "undefined") {
    data.proof_of_payment_file = {};
    data.proof_of_payment_file.url = null;
  }
  if (typeof data.preliminary_submission_file === "undefined") {
    data.preliminary_submission_file = {};
    data.preliminary_submission_file.url = null;
  }
  if (typeof data.semifinal_submission_file === "undefined") {
    data.semifinal_submission_file = {};
    data.semifinal_submission_file.url = null;
  }
  if (data.preliminary_submission_last_submitted) {
    data.preliminary_submission_last_submitted = new Date(data.preliminary_submission_last_submitted).toLocaleString('en-GB', { timeZone: 'Asia/Jakarta' });
  }
  if (data.semifinal_submission_last_submitted) {
    data.semifinal_submission_last_submitted = new Date(data.semifinal_submission_last_submitted).toLocaleString('en-GB', { timeZone: 'Asia/Jakarta' });
  }
}

function translateTeamMembersStatusesToString(data) {
  // Gender
  if (data.gender === 0) { data.gender = "Not mentioned" }
  else if (data.gender === 1) { data.gender = "Male" }
  else if (data.gender === 2) { data.gender = "Female" }
  // Files
  if (typeof data.student_id_file === "undefined") {
    data.student_id_file = {};
    data.student_id_file.url = null;
  }
  if (typeof data.poe_file === "undefined") {
    data.poe_file = {};
    data.poe_file.url = null;
  }
}

async function updateTeamsSheet(data, sheet, sheetRows) {
  console.log('[*] Adding Teams rows..');
  for (const row of data) {
    translateTeamsStatusesToString(row);
    const values = {
      teamid: row.team_id,
      timestamp: new Date(row.created_time).toLocaleString('en-GB', { timeZone: 'Asia/Jakarta' }),
      teamname: row.name,
      university: row.university,
      proofofpaymenturl: row.proof_of_payment_file.url,
      proofofpaymentstatus: row.proof_of_payment_verified,
      stage: row.stage,
      preliminarycaseurl: row.preliminary_submission_file.url,
      preliminarycasesubmittime: row.preliminary_submission_last_submitted,
      semifinalqualified: row.semifinal_qualified,
      semifinalcaseurl: row.semifinal_submission_file.url,
      semifinalcasesubmittime: row.semifinal_submission_last_submitted,
      finalqualified: row.final_qualified
    };
    await promisify(sheet.addRow)(values);
  }
  console.log(`[*] Added ${data.length} rows to Teams.`);
}

async function updateTeamMembersSheet(data, sheet, sheetRows) {
  console.log('[*] Adding Team Members rows..');
  for (const row of data) {
    translateTeamMembersStatusesToString(row);
    const values = {
      userid: row.id,
      timestamp: new Date(row.created_time).toLocaleString('en-GB', { timeZone: 'Asia/Jakarta' }),
      name: row.name,
      email: row.email,
      teamid: row.team_id,
      university: row.university,
      major: row.major,
      gender: row.gender,
      phonenumber: row.mobile_no,
      studentidurl: row.student_id_file.url,
      studentidstatus: row.student_id_status,
      poeurl: row.poe_file.url,
      poestatus: row.poe_status
    };
    await promisify(sheet.addRow)(values);
  }
  console.log(`[*] Added ${data.length} rows to Team Members.`);
}

async function populateAllFiles(filesMap, data) {
  if(!data) {
    return;
  }

  for (let obj of data) {
    if(obj.poe_file_id) {
      obj.poe_file = filesMap[obj.poe_file_id];
    }
    if(obj.student_id_file_id) {
      obj.student_id_file = filesMap[obj.student_id_file_id];
    }
    if(obj.proof_of_payment_file_id) {
      obj.proof_of_payment_file = filesMap[obj.proof_of_payment_file_id];
    }
    if(obj.preliminary_submission_file_id) {
      obj.preliminary_submission_file = filesMap[obj.preliminary_submission_file_id];
    }
    if(obj.semifinal_submission_file_id) {
      obj.semifinal_submission_file = filesMap[obj.semifinal_submission_file_id];
    }
  }

  return data;
}

async function addWorksheet(doc, worksheet) {
  return new Promise((resolve, reject) => {
    try {
      doc.addWorksheet(worksheet);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Accessing Google Spreadsheet
 */
module.exports.accessSpreadsheet =  async function() {
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID);

  console.log("[*] Authenticating service account for Google Sheets..");
  await promisify(doc.useServiceAccountAuth)(creds);

  console.log("[*] Retrieving sheets information..");
  const info = await promisify(doc.getInfo)();
  const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Jakarta' });

  // Create new worksheets
  const teamsWorksheet = {
    title: `Teams (${timestamp})`,
    headers: [
      'Team ID', 'Timestamp', 'Team name', 'University', 'Proof of payment URL', 'Proof of payment status',
      'Stage', 'Preliminary case URL', 'Preliminary case submit time', 'Preliminary case status',
      'Semifinal qualified', 'Semifinal case file URL', 'Semifinal case submit time',
      'Semifinal case status', 'Final qualified'
    ]
  };
  console.log("[*] Creating new Teams worksheet...");
  await addWorksheet(doc, teamsWorksheet);

  const teamMembersWorksheet = {
    title: `Team Members (${timestamp})`,
    headers: [
      'User ID', 'Timestamp', 'Name', 'Email', 'Team ID', 'University', 'Major', 'Student ID URL',
      'Student ID status', 'PoE URL', 'PoE status', 'Gender', 'Phone number'
    ]
  };

  console.log("[*] Creating new Team Members worksheet...");
  await addWorksheet(doc, teamMembersWorksheet);

  // Get all files and map
  console.log("[*] Retrieving files data..");
  const files = await filesRepository.getAll();
  const filesMap = files.reduce(function(map, obj) {
    map[obj.id] = obj;
    return map;
  }, {});

  // Update teams
  console.log("[*] Retrieving teams data..");
  let team = await teamsRepository.getAllTeams();
  let teams = await populateAllFiles(filesMap, team);
  await updateTeamsSheet(teams, info.worksheets[2], null);

  // Update users
  console.log("[*] Retrieving team members data..");
  let user = await usersRepository.getAllUsers();
  let users = await populateAllFiles(filesMap, user);
  await updateTeamMembersSheet(users, info.worksheets[3], null);

  // Delete old sheets
  await promisify(info.worksheets[0].del)();
  await promisify(info.worksheets[1].del)();
};