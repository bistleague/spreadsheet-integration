# spreadsheet-integration
BIST League back-end to Google Spreadsheet integration

### Environment Variables
```dotenv
GOOGLE_SPREADSHEET_ID=<insert Google Spreadsheet ID>
GCP_PROJECT_ID=<insert GCP project ID>
GCP_DATASTORE_CREDENTIALS_JSON_PATH=<insert service account JSON path>
```

### Deployment to Cloud Functions
```
gcloud functions deploy spreadsheet-integration --runtime nodejs10 --entry-point exportToSheets --env-vars-file .env.yaml --trigger-topic exportToSheets
```