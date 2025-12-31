"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getReviewQuestions, updateQuestionStatus, deleteQuestion } from '../../utils/db';
import ReviewQuizView from '../components/ReviewQuizView';
import styles from '../upload/page.module.css'; // スタイル流用

export default function ReviewPage() {
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [finished, setFinished] = useState(false);

    useEffect(() => {
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        setLoading(true);
        try {
            const list = await getReviewQuestions();
            setQuestions(list);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = async (isCorrect) => {
        const currentQ = questions[currentIndex];
        await updateQuestionStatus(currentQ.id, isCorrect);

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setFinished(true);
        }
    };

    const handleDelete = async () => {
        if (!confirm('本当にこの問題を削除しますか？')) return;

        const currentQ = questions[currentIndex];
        await deleteQuestion(currentQ.id);

        const newQuestions = questions.filter(q => q.id !== currentQ.id);
        setQuestions(newQuestions);

        if (newQuestions.length === 0) {
            setFinished(true); // 問題がなくなったので終了扱い
        } else if (currentIndex >= newQuestions.length) {
            // 最後の問題を削除した場合、インデックスを戻す
            setCurrentIndex(newQuestions.length - 1);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>復習データを読み込んでいます...</p>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <Link href="/" className={styles.backLink}>←</Link>
                    <h1 className={styles.title}>本日の復習</h1>
                </header>
                <div className={styles.uploadCard}>
                    <div style={{ fontSize: '3rem' }}>🎉</div>
                    <h2>復習完了！</h2>
                    <p>現在、復習が必要な問題はありません。</p>
                    <Link href="/" className="btn btn-primary mt-4">ホームに戻る</Link>
                </div>
            </div>
        );
    }

    if (finished) {
        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <Link href="/" className={styles.backLink}>←</Link>
                    <h1 className={styles.title}>学習完了</h1>
                </header>
                <div className={styles.uploadCard}>
                    <div style={{ fontSize: '3rem' }}>🙌</div>
                    <h2>お疲れ様でした！</h2>
                    <p>今日の復習分 {questions.length} 問を完了しました。</p>
                    <Link href="/" className="btn btn-primary mt-4">ホームに戻る</Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/" className={styles.backLink}>←</Link>
                <h1 className={styles.title}>本日の復習 ({currentIndex + 1}/{questions.length})</h1>
            </header>

            <ReviewQuizView
                question={questions[currentIndex]}
                onAnswer={handleAnswer}
                onDelete={handleDelete}
            />
        </div>
    );
}
