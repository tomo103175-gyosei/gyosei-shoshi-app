"use client";

import { useState } from 'react';
import styles from './QuizView.module.css';

export default function QuizView({ quizData, onNext, categoryLabel, loadingNext }) {
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);

    // リセット用: quizDataが変わったら状態を初期化
    // ただし、親コンポーネントで制御するほうがReactらしいが、
    // シンプルにするためKeyで再マウントさせるか、Effectを使う。
    // ここでは新しい問題が来たらリセットしたいが、親がKeyを変える運用を想定。

    const handleOptionClick = (index) => {
        if (isAnswered) return;
        setSelectedOption(index);
        setIsAnswered(true);
    };

    const getOptionClass = (index) => {
        if (!isAnswered) return styles.optionButton;

        if (index === quizData.correctIndex) {
            return `${styles.optionButton} ${styles.optionCorrect}`;
        }

        if (index === selectedOption && index !== quizData.correctIndex) {
            return `${styles.optionButton} ${styles.optionIncorrect}`;
        }

        return `${styles.optionButton} ${styles.optionDimmed}`;
    };

    return (
        <div className={styles.container}>
            {categoryLabel && (
                <div className={styles.headerBadge}>
                    <span className={styles.categoryBadge}>{categoryLabel}</span>
                </div>
            )}

            <div className={styles.questionCard}>
                <h2 className={styles.questionText}>{quizData.question}</h2>
            </div>

            <div className={styles.optionsGrid}>
                {quizData.options.map((option, index) => (
                    <button
                        key={index}
                        className={getOptionClass(index)}
                        onClick={() => handleOptionClick(index)}
                        disabled={isAnswered}
                    >
                        {index + 1}. {option}
                    </button>
                ))}
            </div>

            {isAnswered && (
                <div className={styles.resultSection}>
                    <div className={styles.explanationCard}>
                        <div className={styles.resultHeader}>
                            {selectedOption === quizData.correctIndex ? (
                                <span className={styles.correctLabel}>⭕ 正解</span>
                            ) : (
                                <span className={styles.incorrectLabel}>❌ 不正解</span>
                            )}
                        </div>

                        <div className={styles.explanationText}>
                            {quizData.explanation}
                        </div>

                        {quizData.reference && (
                            <div className={styles.referenceBox}>
                                <div className={styles.referenceTitle}>根拠・参照</div>
                                {quizData.reference}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onNext}
                        className={`btn btn-primary ${styles.nextButton}`}
                        disabled={loadingNext}
                    >
                        {loadingNext ? '作成中...' : '次の問題へ挑戦'}
                    </button>
                </div>
            )}
        </div>
    );
}
