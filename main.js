/**
 * BistLeague back-end integration with Google Spreadsheet
 * @author ALfian Maulana Ibrahim
 * @library https://github.com/theoephraim/node-google-spreadsheet
 */

require("dotenv").config();

const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');

const creds = require(process.env.GCP_DATASTORE_CREDENTIALS_JSON_PATH);

const teamsRepository = require('./datastore/teams');
const usersRepository = require('./datastore/users');
const filesRepository = require('./datastore/files');

/**
 * Convert document and stage status to string
 * {{ STILL INCOMPLETE }}
 */
async function changeStatus(data, sheetType) {
	// TEAMS
	if (sheetType == "Teams") {
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
			data.preliminary_submission_last_submitted = new Date(data.preliminary_submission_last_submitted).toLocaleString();
		}
		if (data.semifinal_submission_last_submitted) {
			data.semifinal_submission_last_submitted = new Date(data.semifinal_submission_last_submitted).toLocaleString();
		}
	}

	// TEAM MEMBERS
	if (sheetType == "Team members") {
		// Gender
		if (data.gender == 0) { data.gender = "Not mentioned" }
			else if (data.gender == 1) { data.gender = "Male" }
			else if (data.gender == 2) { data.gender = "Female" }
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
}

/**
 * Update all rows
 * {{ INCONSISTENT }}
 */
async function updateSheet(data, sheet, sheetRows, sheetType) {
	// Add new rows
	if (sheetType == "Teams") {
		console.log('Add Teams rows');
		for (var row of data) {
			await changeStatus(row, sheetType);
			const values = {
				teamid: row.team_id,
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
			}
			await promisify(sheet.addRow)(values);
		}
	}
	if (sheetType == "Team members") {
		console.log('Add Team members rows');
		for (var row of data) {
			await changeStatus(row, sheetType);
			const values = {
				userid: row.id,
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
	const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID);
	await promisify(doc.useServiceAccountAuth)(creds);
	const info = await promisify(doc.getInfo)();
	const timestamp = new Date().toLocaleString();

	// Create new worksheets
	doc.addWorksheet({
		title: `Teams (${timestamp})`,
		headers: [
			'Team ID', 'Team name', 'University', 'Proof of payment URL', 'Proof of payment status',
			'Stage', 'Preliminary case URL', 'Preliminary case submit time', 'Preliminary case status',
			'Semifinal qualified', 'Semifinal case file URL', 'Semifinal case submit time',
			'Semifinal case status', 'Final qualified'
		]
	}, () => {
		doc.addWorksheet({
			title: `Team Members (${timestamp})`,
			headers: [
				'User ID', 'Name', 'Email', 'Team ID', 'University', 'Major', 'Student ID URL',
				'Student ID status', 'PoE URL', 'PoE status', 'Gender', 'Phone number'
			]
		});
	});

	// Update teams
	let team = await teamsRepository.getAllTeams();
	let teams = await filesRepository.getAllFiles(team);
	updateSheet(teams, info.worksheets[2], null, "Teams");

	// Update users
	let user = await usersRepository.getAllUsers();
	let users = await filesRepository.getAllFiles(user);
	updateSheet(users, info.worksheets[3], null, "Team members");
	
	// Delete old sheets
	await promisify(info.worksheets[0].del)();
	await promisify(info.worksheets[1].del)();
}

accessSpreadsheet();