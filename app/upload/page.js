"use client";

import { useState, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import QuizView from '../components/QuizView';

export default function UploadPage() {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [quizData, setQuizData] = useState(null);
    const [quizKey, setQuizKey] = useState(0);

    const inputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file) => {
        if (file.type !== "application/pdf") {
            setError("PDFファイルのみアップロード可能です");
            return;
        }
        setFile(file);
        setError(null);
        processFile(file);
    };

    const onButtonClick = () => {
        inputRef.current.click();
    };

    const processFile = async (uploadedFile) => {
        setLoading(true);
        setError(null);
        setQuizData(null);
        setQuizKey(prev => prev + 1);

        const formData = new FormData();
        formData.append("file", uploadedFile);

        try {
            const response = await fetch('/api/process-pdf', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || '解析に失敗しました');
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            setQuizData(data);
        } catch (err) {
            setError(err.message);
            setFile(null); // エラー時はリセット
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        setFile(null);
        setQuizData(null);
        setError(null);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/" className={styles.backLink} aria-label="戻る">
                    ←
                </Link>
                <h1 className={styles.title}>過去問アップロード</h1>
            </header>

            {!quizData && !loading && (
                <>
                    <div
                        className={`${styles.uploadCard} ${dragActive ? styles.uploadCardActive : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={onButtonClick}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            className={styles.fileInput}
                            accept=".pdf"
                            onChange={handleChange}
                        />
                        <div className={styles.icon}>📄</div>
                        <div className={styles.uploadText}>
                            クリックまたはドラッグ＆ドロップで<br />PDFをアップロード
                        </div>
                        <p className={styles.uploadSubText}>行政書士試験の過去問や資料 (PDF形式)</p>
                        <div className={styles.selectButton}>ファイルを選択</div>
                        {file && <div className={styles.fileName}>{file.name}</div>}
                    </div>

                    {error && (
                        <div className={styles.errorContainer}>
                            <p>{error}</p>
                        </div>
                    )}
                </>
            )}

            {loading && (
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>PDFを解析し、問題を作成しています...<br />（数秒～数十秒かかる場合があります）</p>
                </div>
            )}

            {quizData && (
                <QuizView
                    key={quizKey}
                    quizData={quizData}
                    onNext={() => processFile(file)} // 同じファイルで別の問題を作るために再送信
                    loadingNext={loading}
                    categoryLabel="PDF解析問題"
                />
            )}

            {quizData && (
                <div style={{ marginTop: '20px' }}>
                    <button onClick={handleRetry} className="btn btn-outline">
                        別のファイルをアップロード
                    </button>
                </div>
            )}
        </div>
    );
}
