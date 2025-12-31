"use client";

import { useState, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { parseSpreadsheet, normalizeCorrectAnswer } from '../../utils/parsers';
import { addQuestions } from '../../utils/db';

export default function UploadPage() {
    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

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

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = async (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            await handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file) => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            let questions = [];

            if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                // スプレッドシート処理
                questions = await parseSpreadsheet(file);
                if (questions.length === 0) {
                    throw new Error("有効な問題データが見つかりませんでした。フォーマットを確認してください。");
                }
            } else if (file.type === "application/pdf") {
                // PDF処理 (サーバーサイド)
                const formData = new FormData();
                formData.append("file", file);
                const res = await fetch('/api/process-pdf', { method: 'POST', body: formData });
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || '解析エラー');
                }
                const data = await res.json();

                // プロンプト修正により O/X 形式で返ってくる
                if (data.text) {
                    questions.push({
                        text: data.text,
                        correctAnswer: normalizeCorrectAnswer(data.correctAnswer),
                        explanation: `${data.explanation}\n(参照: ${data.reference || ''})`,
                        source: file.name
                    });
                }
            } else if (file.type.startsWith("image/")) {
                // 画像処理
                const formData = new FormData();
                formData.append("file", file);
                const res = await fetch('/api/process-image', { method: 'POST', body: formData });
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || '解析エラー');
                }
                const data = await res.json();
                // APIは配列で返すと想定
                questions = data.map(q => ({
                    text: q.text,
                    correctAnswer: normalizeCorrectAnswer(q.correctAnswer),
                    explanation: q.explanation,
                    source: file.name
                }));
            } else {
                throw new Error("サポートされていないファイル形式です (PDF, Excel, CSV, 画像)");
            }

            if (questions.length > 0) {
                await addQuestions(questions);
                setSuccessMessage(`${questions.length}問の問題を取り込みました！`);
            } else {
                throw new Error("問題を作成できませんでした");
            }

        } catch (err) {
            console.error(err);
            setError(err.message || "エラーが発生しました");
        } finally {
            setLoading(false);
            if (inputRef.current) inputRef.current.value = ""; // リセット
        }
    };

    const onButtonClick = () => {
        inputRef.current.click();
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/" className={styles.backLink} aria-label="戻る">
                    ←
                </Link>
                <h1 className={styles.title}>過去問・資料アップロード</h1>
            </header>

            {!loading ? (
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
                            accept=".pdf,.csv,.xlsx,.xls,image/*"
                            onChange={handleChange}
                        />
                        <div className={styles.icon}>📂</div>
                        <div className={styles.uploadText}>
                            クリックまたはドラッグでファイルをアップロード
                        </div>
                        <p className={styles.uploadSubText}>
                            対応: PDF, Excel, CSV, 画像 (jpg/png)
                        </p>
                        <div className={styles.selectButton}>ファイルを選択</div>
                    </div>

                    {error && (
                        <div className={styles.errorContainer}>
                            <p>⚠️ {error}</p>
                        </div>
                    )}

                    {successMessage && (
                        <div className="alert alert-success mt-4">
                            <p>✅ {successMessage}</p>
                            <Link href="/" className="btn btn-sm btn-ghost mt-2">
                                ホームに戻る
                            </Link>
                        </div>
                    )}
                </>
            ) : (
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>ファイルを解析し、データベースに登録しています...</p>
                </div>
            )}

            <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
                <h3>💡 アップロードのヒント</h3>
                <ul>
                    <li>Excel/CSV形式の場合: A列=問題, B列=◯or☓, C列=解説</li>
                    <li>画像の場合: 文字が読み取れる明るい写真を使用してください</li>
                </ul>
            </div>
        </div>
    );
}
