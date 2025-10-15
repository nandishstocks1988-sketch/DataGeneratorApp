import React, { useState } from 'react';
import TabForm from './components/TabForm';

const recordTypes = [
    "Accounts", "Contacts", "Leads", "Team Members", "Group Number", "Quote", "Case", "Opportunity"
];

export default function App() {
    const [activeTab, setActiveTab] = useState(recordTypes[0]);

    return (
        <div style={{ fontFamily: 'Arial', margin: '20px' }}>
            <h1>Salesforce Data Generator</h1>
            <div style={{ marginBottom: '20px' }}>
                {recordTypes.map(type => (
                    <button
                        key={type}
                        onClick={() => setActiveTab(type)}
                        style={{
                            padding: '10px 20px',
                            marginRight: '5px',
                            background: activeTab === type ? '#1976d2' : '#e3e3e3',
                            color: activeTab === type ? 'white' : 'black',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        {type}
                    </button>
                ))}
            </div>
            <TabForm recordType={activeTab} />
        </div>
    );
}
