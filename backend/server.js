const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { generateData } = require('./utils/dataGenerator');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// Download template endpoint
app.get('/api/template/:type', (req, res) => {
    const { type } = req.params;
    const templatePath = path.join(__dirname, '../frontend/src/template/Account_Template.xlsx'); // demo
    res.download(templatePath, `${type}_Template.xlsx`);
});

// Generate data endpoint
app.post('/api/generate', upload.single('file'), async (req, res) => {
    const { body, file } = req;
    // Read CSV/Workbench data dump
    const dumpPath = path.join(__dirname, 'data/salesforce_dump.csv');
    const dumpData = fs.readFileSync(dumpPath, 'utf8');
    // Generate result
    const result = generateData(body, dumpData);
    // Return result as downloadable CSV
    const resultPath = path.join(__dirname, 'data/result.csv');
    fs.writeFileSync(resultPath, result.csv);
    res.json({ success: true, resultUrl: '/api/download/result.csv', stats: result.stats });
});

// Download result endpoint
app.get('/api/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'data', req.params.filename);
    res.download(filePath);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));