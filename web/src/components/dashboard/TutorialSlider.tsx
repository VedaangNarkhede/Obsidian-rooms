'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './TutorialSlider.module.css';

export default function TutorialSlider() {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            title: "Let's Get Started!",
            subtitle: "Your local knowledge base, instantly on the web.",
            content: (
                <div className={styles.slideContent}>
                    <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>This dashboard allows you to manage your synced Obsidian vaults and securely share them with others. Let's get your Obsidian app connected.</p>
                    <p style={{ color: '#98c379', fontWeight: 'bold' }}>Click Next to begin!</p>
                </div>
            )
        },
        {
            title: "Step 1: Generate API Key",
            subtitle: "Secure connection to your dashboard.",
            content: (
                <div className={styles.slideContent}>
                    <p>To securely sync your notes, you need to generate a Personal API Key. Keep this secret!</p>
                    <Link href="/dashboard/settings" className={styles.actionBtn}>
                        Go to Settings & Generate Key
                    </Link>
                </div>
            )
        },
        {
            title: "Step 2: Download Plugin",
            subtitle: "The official Obsidian plugin.",
            content: (
                <div className={styles.slideContent}>
                    <p>Download the official Obsidian Rooms plugin to your computer.</p>
                    <a href="/downloads/obsidian-rooms-plugin.zip" download className={styles.actionBtn} style={{ background: '#98c379', color: '#282c34' }}>
                        Download Plugin (.zip)
                    </a>
                </div>
            )
        },
        {
            title: "Step 3: Install Plugin",
            subtitle: "Quick installation on Windows.",
            content: (
                <div className={styles.slideContent}>
                    <ol className={styles.stepsList}>
                        <li>Extract the downloaded <strong>.zip</strong> file to a folder.</li>
                        <li>Double-click the <strong>install.bat</strong> file inside the folder.</li>
                        <li>When prompted, paste the full path to your Obsidian vault (e.g. <code>C:\Users\Name\Documents\Vault</code>).</li>
                    </ol>
                    <p className={styles.hint}>The script will automatically install the plugin into your vault's hidden .obsidian folder.</p>
                </div>
            )
        },
        {
            title: "Step 4: Configure Obsidian",
            subtitle: "Enable and connect.",
            content: (
                <div className={styles.slideContent}>
                    <ol className={styles.stepsList}>
                        <li>Open Obsidian.</li>
                        <li>Go to <strong>Settings &rarr; Community Plugins</strong> and disable Safe Mode if prompted.</li>
                        <li>Find "Obsidian Rooms" in the installed plugins list and toggle it <strong>ON</strong>.</li>
                        <li>Click the gear icon next to the plugin to open its settings.</li>
                        <li>Paste your <strong>API Key</strong> and enter a name for your vault.</li>
                    </ol>
                </div>
            )
        },
        {
            title: "Step 5: Share your Notes!",
            subtitle: "1-Click publish from your desktop.",
            content: (
                <div className={styles.slideContent}>
                    <p>You are ready! Open any note in Obsidian, open the Command Palette (Ctrl+P), and type:</p>
                    <strong style={{ color: '#61afef', background: '#1e1e1e', padding: '0.5rem 1rem', borderRadius: '4px', display: 'inline-block', margin: '1rem 0' }}>Add note to shared vault</strong>
                    <p>A preview will appear showing exactly which linked files will be synced. Click <strong>Confirm</strong>, and watch them instantly appear on this dashboard!</p>
                </div>
            )
        }
    ];

    return (
        <div className={styles.sliderContainer}>
            <div 
                className={styles.slidesTrack} 
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
                {slides.map((slide, idx) => (
                    <div key={idx} className={styles.slide}>
                        <h2 className={styles.slideTitle}>{slide.title}</h2>
                        <h4 className={styles.slideSubtitle}>{slide.subtitle}</h4>
                        {slide.content}
                    </div>
                ))}
            </div>

            <div className={styles.controls}>
                <button 
                    onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                    disabled={currentSlide === 0}
                    className={styles.controlBtn}
                >
                    &larr; Prev
                </button>
                
                <div className={styles.dots}>
                    {slides.map((_, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => setCurrentSlide(idx)}
                            className={`${styles.dot} ${idx === currentSlide ? styles.activeDot : ''}`}
                        />
                    ))}
                </div>

                <button 
                    onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
                    disabled={currentSlide === slides.length - 1}
                    className={styles.controlBtn}
                >
                    Next &rarr;
                </button>
            </div>
        </div>
    );
}
