/**
 * BistLeague back-end integration with Google Spreadsheet
 * @author ALfian Maulana Ibrahim
 * @library https://github.com/theoephraim/node-google-spreadsheet
 */

require("dotenv").config();

const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');

const creds = require(process.env.GCP_DATASTORE_CREDENTIALS_JSON_PATH);
// const creds = require('./client_secret.json');

const teamsRepository = require('./datastore/teams');
const usersRepository = require('./datastore/users');

/**
 * Convert document and stage status to string
 * {{ STILL INCOMPLETE }}
 */
async function changeStatus(data) {
	// TEAMS
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
	if (data.stage == 0) { data.stage = "Registered"; }
		else if (data.stage == 1) { data.stage = "Completed"; }
		else if (data.stage == 2) { data.stage = "Submitted preliminary"; }
		else if (data.stage == 3) { data.stage = "Qualified semifinal"; }
		else if (data.stage == 4) { data.stage = "Submitted semifinal"; }
		else if (data.stage == 5) { data.stage = "Qualified final"; }

	// TEAM MEMBERS
	// Gender
	if (data.gender == 0) { data.gender = "Not mentioned" }
		else if (data.gender == 1) { data.gender = "Male" }
		else if (data.gender == 2) { data.gender = "Female" }
}

/**
 * Update all rows
 */
async function updateSheet(data, sheet, sheetRows, sheetType) {
	// Delete existing rows
	sheetRows.forEach(row => {
		row.del();
	});

	// Add new rows
	if (sheetType == "Teams") {
		for (var row of data) {
			await changeStatus(row);
			const values = {
				teamid: row.team_id,
				teamname: row.name,
				university: row.university,
				proofofpaymentstatus: row.proof_of_payment_verified,
				stage: row.stage
			}
			await promisify(sheet.addRow)(values);
		}
	}
	if (sheetType == "Team members") {
		for (var row of data) {
			await changeStatus(row);
			const values = {
				userid: row.id,
				name: row.name,
				email: row.email,
				teamid: row.team_id,
				university: row.university,
				major: row.major,
				gender: row.gender,
				phonenumber: row.mobile_no,
				studentidstatus: row.student_id_status,
				poestatus: row.poe_status,
			}
			await promisify(sheet.addRow)(values);
		}
	}

	console.log(`${sheetType} sheet updated!`);
}


/**
 * Accessing Google Spreadsheet
 */
async function accessSpreadsheet() {
	const doc = new GoogleSpreadsheet('1Cec0FCoiqPTXWYeMylkRQmjgAR_-U5aUcHbR70RkDvs');
	await promisify(doc.useServiceAccountAuth)(creds);
	const info = await promisify(doc.getInfo)();
	const teamsSheet = info.worksheets[0];
	const teamMembersSheet = info.worksheets[1];

	// Update teams
	let teams = await teamsRepository.getAllTeams();
	let teamRows = await promisify(teamsSheet.getRows)();
	updateSheet(teams, teamsSheet, teamRows, "Teams");

	// Update users
	let users = await usersRepository.getAllUsers();
	let userRows = await promisify(teamMembersSheet.getRows)();
	updateSheet(users, teamMembersSheet, userRows, "Team members");
}

accessSpreadsheet();