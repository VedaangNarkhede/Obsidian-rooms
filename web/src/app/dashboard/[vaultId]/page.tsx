import React from 'react';

export default function VaultDashboardEmptyState() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#5c6370' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#abb2bf' }}>Vault Overview</h2>
            <p>Select a note from the tree on the left to begin reading.</p>
            <p>Or click on a node in the Graph View on the right to navigate.</p>
        </div>
    );
}
