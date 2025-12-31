"use client";

import { useState } from 'react';
import styles from './QuizView.module.css'; // 既存のスタイルを流用

export default function ReviewQuizView({ question, onAnswer, onDelete }) {
    const [selected, setSelected] = useState(null);
    const [showResult, setShowResult] = useState(false);

    const handleAnswer = (answer) => {
        if (showResult) return;
        setSelected(answer);
        setShowResult(true);
    };

    const isCorrect = selected === question.correctAnswer;

    // Check if the question is 5-choice or O/X
    const isFiveChoice = ['1', '2', '3', '4', '5'].includes(String(question.correctAnswer));

    const handleNext = () => {
        onAnswer(isCorrect);
        // 状態リセット
        setSelected(null);
        setShowResult(false);
    };

    const renderOptions = () => {
        if (isFiveChoice) {
            return (
                <div className={styles.optionsGrid}>
                    {[1, 2, 3, 4, 5].map((num) => {
                        const strNum = String(num);
                        let className = styles.optionButton;

                        if (showResult) {
                            if (question.correctAnswer === strNum) {
                                className += ` ${styles.optionCorrect}`;
                            } else if (selected === strNum && question.correctAnswer !== strNum) {
                                className += ` ${styles.optionIncorrect}`;
                            } else {
                                className += ` ${styles.optionDimmed}`;
                            }
                        }

                        return (
                            <button
                                key={num}
                                className={className}
                                onClick={() => handleAnswer(strNum)}
                                disabled={showResult}
                            >
                                {num}
                            </button>
                        );
                    })}
                </div>
            );
        } else {
            // Default to O/X
            return (
                <div className={styles.optionsGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <button
                        className={`${styles.optionButton} ${showResult && question.correctAnswer === 'O' ? styles.optionCorrect : ''} ${showResult && selected === 'O' && question.correctAnswer !== 'O' ? styles.optionIncorrect : ''}`}
                        onClick={() => handleAnswer('O')}
                        disabled={showResult}
                        style={{ fontSize: '2rem' }}
                    >
                        ⭕
                    </button>
                    <button
                        className={`${styles.optionButton} ${showResult && question.correctAnswer === 'X' ? styles.optionCorrect : ''} ${showResult && selected === 'X' && question.correctAnswer !== 'X' ? styles.optionIncorrect : ''}`}
                        onClick={() => handleAnswer('X')}
                        disabled={showResult}
                        style={{ fontSize: '2rem' }}
                    >
                        ❌
                    </button>
                </div>
            );
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.headerBadge} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={styles.categoryBadge}>復習問題 (v2)</span>
                {onDelete && (
                    <button
                        onClick={onDelete}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px' }}
                        aria-label="この問題を削除"
                    >
                        🗑️
                    </button>
                )}
            </div>

            <div className={styles.questionCard}>
                <h2 className={styles.questionText} style={{ whiteSpace: 'pre-wrap' }}>{question.text}</h2>

            </div>

            {renderOptions()}

            {showResult && (
                <div className={styles.resultSection}>
                    <div className={styles.explanationCard}>
                        <div className={styles.resultHeader}>
                            {isCorrect ? (
                                <span className={styles.correctLabel}>⭕ 正解！</span>
                            ) : (
                                <span className={styles.incorrectLabel}>❌ 不正解...</span>
                            )}
                        </div>
                        <div className={styles.explanationText} style={{ whiteSpace: 'pre-wrap' }}>
                            {question.explanation}
                        </div>
                        <p style={{ marginTop: '10px', fontSize: '0.8rem', color: '#666' }}>
                            出典: {question.source}
                        </p>
                    </div>

                    <button onClick={handleNext} className={`btn btn-primary ${styles.nextButton}`}>
                        次へ
                    </button>
                </div>
            )}
        </div>
    );
}
