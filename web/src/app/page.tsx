'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Landing.module.css';

export default function Home() {
    const scrollToBottom = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const bottomSection = document.getElementById('cta-section');
        if (bottomSection) {
            bottomSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const [mockupIndex, setMockupIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMockupIndex(prev => (prev + 1) % 3);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
            
            <nav className={styles.navbar}>
                <Link href="/" className={styles.navLogo} style={{ fontFamily: 'Syne, sans-serif' }}>
                    Obsidian Rooms
                </Link>
                <div className={styles.navLinks}>
                    <a href="#cta" onClick={scrollToBottom} className={`${styles.navBtn} ${styles.navBtnPrimary}`}>
                        Download
                    </a>
                    <a href="#cta" onClick={scrollToBottom} className={`${styles.navBtn} ${styles.navBtnSecondary}`}>
                        Sign Up / Login
                    </a>
                </div>
            </nav>

            <header className={styles.heroSection}>
                <div className={styles.heroBackground}></div>
                <div className={styles.heroContent}>
                    <h1 className={styles.title} style={{ fontFamily: 'Syne, sans-serif' }}>Your Second Brain,<br/>Now on the Web.</h1>
                    <p className={styles.subtitle}>
                        Your notes, you own them how you want to without anyone's interference.
                    </p>
                </div>
                <div className={styles.scrollIndicator}>
                    &darr;
                </div>
            </header>

            <main className={styles.featureSection}>
                
                {/* Feature 1: Interactive Graph */}
                <div className={styles.featureRow}>
                    <div className={styles.featureVisual}>
                        <svg width="100%" height="100%" viewBox="50 50 300 300">
                            {/* Edges */}
                            <line x1="200" y1="200" x2="100" y2="100" stroke="#5c6370" strokeWidth="2" />
                            <line x1="200" y1="200" x2="300" y2="300" stroke="#5c6370" strokeWidth="2" />
                            <line x1="200" y1="200" x2="320" y2="120" stroke="#5c6370" strokeWidth="2" />
                            <line x1="200" y1="200" x2="150" y2="300" stroke="#5c6370" strokeWidth="2" />

                            {/* Nodes & Labels */}
                            <circle cx="200" cy="200" r="16" fill="#61afef" filter="drop-shadow(0 0 8px rgba(97, 175, 239, 0.8))" />
                            <text x="200" y="240" fill="#abb2bf" fontSize="14" textAnchor="middle" fontWeight="bold">index.md</text>

                            <circle cx="100" cy="100" r="10" fill="#e5c07b" filter="drop-shadow(0 0 6px rgba(229, 192, 123, 0.5))" />
                            <text x="100" y="130" fill="#abb2bf" fontSize="12" textAnchor="middle">ideas.md</text>

                            <circle cx="300" cy="300" r="10" fill="#e5c07b" filter="drop-shadow(0 0 6px rgba(229, 192, 123, 0.5))" />
                            <text x="300" y="330" fill="#abb2bf" fontSize="12" textAnchor="middle">planning.md</text>

                            <circle cx="320" cy="120" r="10" fill="#e5c07b" filter="drop-shadow(0 0 6px rgba(229, 192, 123, 0.5))" />
                            <text x="320" y="150" fill="#abb2bf" fontSize="12" textAnchor="middle">tasks.md</text>

                            <circle cx="150" cy="300" r="10" fill="#e5c07b" filter="drop-shadow(0 0 6px rgba(229, 192, 123, 0.5))" />
                            <text x="150" y="330" fill="#abb2bf" fontSize="12" textAnchor="middle">notes.md</text>
                        </svg>
                    </div>
                    <div className={styles.featureText}>
                        <h2 className={styles.featureTitle}>Interactive Graph</h2>
                        <p className={styles.featureDesc}>
                            Experience your vault visually. You can import your notes and see a similar graph like Obsidian directly on the web interface. This offers better visuality and seamless redirection between related concepts.
                        </p>
                    </div>
                </div>

                {/* Feature 2: Simple Import */}
                <div className={`${styles.featureRow} ${styles.featureRowReverse}`}>
                    <div className={styles.featureVisual}>
                        {mockupIndex === 0 && (
                            <div className={styles.readingMockup}>
                                <h3 className={styles.mockTitle}>My Project Plan</h3>
                                <p className={styles.mockText}>
                                    This is my master <span className={styles.mockLink}>index</span> for the new web sync tool. 
                                    It allows seamless publishing directly from Obsidian to the web!
                                </p>
                                <p className={styles.mockText}>
                                    Everything linked here, like <span className={styles.mockLink}>ideas</span> and <span className={styles.mockLink}>tasks</span>, will automatically bundle together.
                                </p>
                            </div>
                        )}
                        {mockupIndex === 1 && (
                            <div className={styles.readingMockup}>
                                <h3 className={styles.mockTitle}>API Documentation</h3>
                                <p className={styles.mockText}>
                                    Here is how you initialize the core client:
                                </p>
                                <div className={styles.mockCodeBlock}>
                                    <span style={{ color: '#c678dd' }}>import</span> {'{'} Client {'}'} <span style={{ color: '#c678dd' }}>from</span> <span style={{ color: '#98c379' }}>'obsidian-rooms'</span>;<br/><br/>
                                    <span style={{ color: '#e5c07b' }}>const</span> client = <span style={{ color: '#c678dd' }}>new</span> <span style={{ color: '#e5c07b' }}>Client</span>();<br/>
                                    client.<span style={{ color: '#61afef' }}>connect</span>();
                                </div>
                            </div>
                        )}
                        {mockupIndex === 2 && (
                            <div className={styles.readingMockup}>
                                <h3 className={styles.mockTitle}>Architecture</h3>
                                <div style={{ margin: '1rem 0', padding: '1rem', background: 'rgba(8, 109, 221, 0.1)', borderLeft: '4px solid #086ddd', borderRadius: '4px' }}>
                                    <strong style={{ color: '#086ddd', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Note</strong>
                                    <span style={{ fontSize: '0.9rem', color: '#abb2bf' }}>The encryption happens locally before uploading.</span>
                                </div>
                                <div style={{ textAlign: 'center', padding: '1rem', background: '#abb2bf', borderRadius: '4px', margin: '1rem 0' }}>
                                    <svg width="200" height="60" viewBox="0 0 200 60">
                                        <rect x="10" y="10" width="60" height="40" rx="4" fill="#fff" stroke="#333" strokeWidth="2" />
                                        <text x="40" y="35" fontSize="12" textAnchor="middle" fill="#333" fontWeight="bold">Client</text>
                                        <line x1="70" y1="30" x2="125" y2="30" stroke="#333" strokeWidth="2" markerEnd="url(#arrow)" />
                                        <rect x="130" y="10" width="60" height="40" rx="4" fill="#fff" stroke="#333" strokeWidth="2" />
                                        <text x="160" y="35" fontSize="12" textAnchor="middle" fill="#333" fontWeight="bold">Server</text>
                                        <defs>
                                            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                                <path d="M 0 0 L 10 5 L 0 10 z" fill="#333" />
                                            </marker>
                                        </defs>
                                    </svg>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className={styles.featureText}>
                        <h2 className={styles.featureTitle}>Simple 1-Click Import</h2>
                        <p className={styles.featureDesc}>
                            Have a minibook created? No worries! You don't have to import all the pages or files one by one. Simply import just the index note which has all the files linked, and everything gets imported in just one click.
                        </p>
                    </div>
                </div>

            </main>

            <section id="cta-section" className={styles.ctaSection}>
                <h2 className={styles.ctaTitle}>Interested to start the journey?</h2>
                <div className={styles.ctaButtons}>
                    <a href="/downloads/obsidian-rooms-plugin.zip" download className={`${styles.btnLarge} ${styles.btnLargePrimary}`}>
                        Download Plugin
                    </a>
                    <Link href="/dashboard" className={`${styles.btnLarge} ${styles.btnLargeSecondary}`}>
                        Sign Up / Login
                    </Link>
                </div>
            </section>

        </div>
    );
}
