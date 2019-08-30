const { accessSpreadsheet } = require('./lib/spreadsheet');

/**
 * Export to Sheets Worker Function
 *
 * @param {object} data The event payload.
 * @param {object} context The event metadata.
 */
exports.exportToSheets = (data, context) => {
  console.log("[*] Begin Google Sheets integration cron job...");
  accessSpreadsheet()
      .then(() => {
        console.log("[x] Cron job executed successfully.");
      })
      .catch((e) => {
        console.log("[x] Cron job failed to execute.", e);
      });
};