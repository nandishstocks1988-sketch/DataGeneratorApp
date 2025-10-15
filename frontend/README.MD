# Salesforce Data Generator App

A full-stack application for generating Salesforce data records.  
- **Frontend:** React (multi-tab forms, parameter selection, file upload/download)
- **Backend:** Node.js/Express (template download, data generation, results)

## Setup

### Backend
```sh
cd backend
npm install
node server.js
```

### Frontend
```sh
cd frontend
npm install
npm start
```

## Usage

1. Select a record type tab (Account, Contact, etc.).
2. Download the template, fill in required fields.
3. Select generation parameters and upload the completed template.
4. Click "Generate / Upload".
5. Download the results file with statuses.

## Notes

- The backend expects a CSV data dump (`backend/data/salesforce_dump.csv`).
- Templates are stored in `frontend/src/template/`.
- Extend `dataGenerator.js` for advanced manipulations as needed.
