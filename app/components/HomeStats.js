"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStats } from '../../utils/db';

export default function HomeStats() {
    const [stats, setStats] = useState({ active: 0, review: 0 });

    useEffect(() => {
        getStats().then(setStats).catch(console.error);
    }, []);

    return (
        <div style={{ marginTop: '2rem', width: '100%', maxWidth: '800px' }}>
            <div className="card" style={{ border: '2px solid #e5e7eb', background: '#fff' }}>
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{ fontSize: '1.5rem' }}>🧠</div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>忘却曲線で復習</h2>
                            <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                                登録された問題: {stats.active}問
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem' }}>
                        <div>
                            <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#666' }}>本日の復習</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stats.review > 0 ? '#ef4444' : '#10b981' }}>
                                {stats.review} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>問</span>
                            </span>
                        </div>

                        {stats.review > 0 ? (
                            <Link href="/review" className="btn btn-primary">
                                復習を開始
                            </Link>
                        ) : (
                            <button className="btn btn-disabled" disabled>完了</button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
