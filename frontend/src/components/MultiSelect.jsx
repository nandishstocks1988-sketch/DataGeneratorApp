import React from 'react';

export default function MultiSelect({ label, options, selected, setSelected }) {
    const handleChange = e => {
        const value = Array.from(e.target.selectedOptions, opt => opt.value);
        setSelected(value);
    };

    return (
        <div style={{ marginBottom: '10px' }}>
            <label>{label}: </label>
            <select multiple value={selected} onChange={handleChange} style={{ minWidth: '150px', height: '60px', marginLeft: '10px' }}>
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
    );
}
