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

app.get('/api/template/:type', (req, res) => {
    const { type } = req.params;
    const templatePath = path.join(__dirname, '../frontend/src/template/Account_Template.xlsx');
    res.download(templatePath, `${type}_Template.xlsx`);
});

app.post('/api/generate', upload.single('file'), async (req, res) => {
    const { body } = req;
    const recordType = body.recordType || "Account";
    let dumpPath = path.join(__dirname, 'data/salesforce_dump.csv');
    if (!fs.existsSync(dumpPath)) {
        return res.status(500).json({ success: false, error: "No data source found." });
    }
    const dumpData = fs.readFileSync(dumpPath, 'utf8');
    const result = generateData(body, dumpData);
    const resultPath = path.join(__dirname, 'data/result.csv');
    fs.writeFileSync(resultPath, result.csv);

    // Log errors if any to result file (append mode)
    if (result.error) {
        fs.appendFileSync(path.join(__dirname, 'logs/generate.log'),
            `[${new Date().toISOString()}] ${result.error}\n`
        );
    }
    res.json({
        success: !result.error,
        resultUrl: '/api/download/result.csv',
        stats: result.stats,
        error: result.error || undefined
    });
});

app.get('/api/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'data', req.params.filename);
    res.download(filePath);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));