import React from 'react';

export default function Loading() {
    return (
        <div className="loading">
            <div className="loader-orbit">
                <i/><i/><i/>
            </div>
            <span>Rendering note...</span>
        </div>
    );
}
