import React, { useState } from 'react';
import axios from 'axios';
import MultiSelect from './MultiSelect';

const STATES = ["CA", "CO", "CT", "GA", "IN", "KY", "ME", "MO", "NH", "NV", "OH", "VA", "WI"];
const PRODUCT_GROUPS = ["HRA", "HSA", "EPO", "PPO", "POS", "HMO"];
const GROUP_SIZES = ["51-99", "100-249", "250+"];
const FUNDING_TYPES = ["FI", "ASO", "ASO/ABF"];
const PRODUCTS = ["Medical", "Dental", "Vision", "Specialty"];

export default function TabForm({ recordType }) {
    const [numRecords, setNumRecords] = useState(10);
    const [states, setStates] = useState([]);
    const [productGroups, setProductGroups] = useState([]);
    const [groupSizes, setGroupSizes] = useState([]);
    const [fundingTypes, setFundingTypes] = useState([]);
    const [products, setProducts] = useState([]);
    const [file, setFile] = useState(null);
    const [resultUrl, setResultUrl] = useState('');
    const [stats, setStats] = useState(null);

    const handleDownloadTemplate = () => {
        window.location.href = `/api/template/${recordType}`;
    };

    const handleFileChange = e => {
        setFile(e.target.files[0]);
    };

    const handleGenerate = async () => {
        const formData = new FormData();
        formData.append('file', file || new Blob());
        formData.append('recordType', recordType);
        formData.append('numRecords', numRecords);
        formData.append('states', JSON.stringify(states));
        formData.append('productGroups', JSON.stringify(productGroups));
        formData.append('groupSizes', JSON.stringify(groupSizes));
        formData.append('fundingTypes', JSON.stringify(fundingTypes));
        formData.append('products', JSON.stringify(products));
        const res = await axios.post('/api/generate', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        setResultUrl(res.data.resultUrl);
        setStats(res.data.stats);
    };

    const handleDownloadResults = () => {
        window.location.href = resultUrl;
    };

    return (
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
            <h2>{recordType}</h2>
            <button onClick={handleDownloadTemplate} style={{ marginBottom: '10px', background: '#1976d2', color: 'white', padding: '10px', borderRadius: '4px', border: 'none' }}>
                Download Template
            </button>
            <div style={{ marginBottom: '10px' }}>
                <label>Number of records to Generate:</label>
                <input type="number" value={numRecords} min={1} onChange={e => setNumRecords(+e.target.value)} style={{ marginLeft: '10px', width: '70px' }} />
            </div>
            <MultiSelect label="States" options={STATES} selected={states} setSelected={setStates} />
            <MultiSelect label="Product Group" options={PRODUCT_GROUPS} selected={productGroups} setSelected={setProductGroups} />
            <MultiSelect label="Group Size" options={GROUP_SIZES} selected={groupSizes} setSelected={setGroupSizes} />
            <MultiSelect label="Funding Type" options={FUNDING_TYPES} selected={fundingTypes} setSelected={setFundingTypes} />
            <MultiSelect label="Products" options={PRODUCTS} selected={products} setSelected={setProducts} />

            <div style={{ margin: '10px 0' }}>
                <input type="file" accept=".xlsx,.csv" onChange={handleFileChange} />
            </div>
            <button onClick={handleGenerate} style={{ marginRight: '10px', background: '#1976d2', color: 'white', padding: '10px', borderRadius: '4px', border: 'none' }}>
                Generate / Upload
            </button>
            {resultUrl &&
                <button onClick={handleDownloadResults} style={{ background: '#2e7d32', color: 'white', padding: '10px', borderRadius: '4px', border: 'none' }}>
                    Download Results
                </button>
            }
            {stats &&
                <div style={{ marginTop: '20px', background: '#eafbe7', padding: '10px', borderRadius: '4px', color: '#2e7d32' }}>
                    Data processed: {stats.success} succeeded, {stats.failed} failed
                </div>
            }
        </div>
    );
}
