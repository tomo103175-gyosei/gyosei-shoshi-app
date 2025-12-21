"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import QuizView from '../components/QuizView';

function QuizContent() {
    const searchParams = useSearchParams();
    const category = searchParams.get('category');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quizData, setQuizData] = useState(null);
    const [quizKey, setQuizKey] = useState(0);

    const categoryNames = {
        constitution: "憲法",
        administrative: "行政法",
        civil: "民法",
        commercial: "商法・会社法"
    };
    const categoryLabel = categoryNames[category] || "総合問題";

    const fetchQuiz = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/generate-quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ category }),
            });

            if (!response.ok) {
                throw new Error('問題の生成に失敗しました');
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            setQuizData(data);
            setQuizKey(prev => prev + 1);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [category]);

    useEffect(() => {
        fetchQuiz();
    }, [fetchQuiz]);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/select-category" className={styles.backLink}>
                    ← 分野選択へ
                </Link>
                <span className={styles.categoryBadge}>{categoryLabel}</span>
            </header>

            {loading && (
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>AIが{categoryLabel}の問題を作成中...</p>
                </div>
            )}

            {error && !loading && (
                <div className={styles.errorContainer}>
                    <p className={styles.errorMessage}>エラーが発生しました</p>
                    <p>{error}</p>
                    <button onClick={fetchQuiz} className="btn btn-primary mt-4">
                        再試行
                    </button>
                </div>
            )}

            {quizData && !loading && !error && (
                <QuizView
                    key={quizKey}
                    quizData={quizData}
                    onNext={fetchQuiz}
                    loadingNext={loading}
                    categoryLabel={null}
                />
            )}
        </div>
    );
}

export default function QuizPage() {
    return (
        <Suspense fallback={
            <div className={styles.container}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>読み込み中...</p>
                </div>
            </div>
        }>
            <QuizContent />
        </Suspense>
    );
}
