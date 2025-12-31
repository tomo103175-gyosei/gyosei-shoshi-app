
import { openDB } from 'idb';

const DB_NAME = 'gyosei-app-db-v2';
const DB_VERSION = 1;

export async function initDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('questions')) {
                const store = db.createObjectStore('questions', {
                    keyPath: 'id',
                    autoIncrement: true,
                });
                store.createIndex('nextReviewDate', 'nextReviewDate');
                store.createIndex('status', 'status');
            }
        },
    });
}

export async function addQuestions(questions) {
    const db = await initDB();
    const tx = db.transaction('questions', 'readwrite');
    const store = tx.objectStore('questions');

    for (const q of questions) {
        await store.add({
            ...q,
            status: 'active',
            streak: 0,
            nextReviewDate: Date.now(), // 即時復習対象
            createdAt: Date.now(),
        });
    }

    await tx.done;
}

export async function getReviewQuestions() {
    const db = await initDB();
    const now = Date.now();
    const tx = db.transaction('questions', 'readonly');
    const store = tx.objectStore('questions');
    const index = store.index('nextReviewDate');

    const questions = [];
    // nextReviewDate が現在以前のものを取得
    let cursor = await index.openCursor(IDBKeyRange.upperBound(now));

    while (cursor) {
        if (cursor.value.status === 'active') {
            questions.push(cursor.value);
        }
        cursor = await cursor.continue();
    }

    return questions;
}

export async function updateQuestionStatus(id, isCorrect) {
    const db = await initDB();
    const tx = db.transaction('questions', 'readwrite');
    const store = tx.objectStore('questions');

    const question = await store.get(id);
    if (!question) return;

    if (isCorrect) {
        question.streak += 1;
        // 忘却曲線: 1日, 3日, 7日, 14日, 30日...
        const intervals = [1, 3, 7, 14, 30];
        const days = intervals[Math.min(question.streak - 1, intervals.length - 1)] || 30;

        // 5回連続正解（約1ヶ月後クリア）で削除対象、または完了扱いにする仕様だが
        // ユーザー要望では「1ヶ月後に正解したら削除」とある。
        // ここでは便宜上、streak=5 (1,3,7,14,30日後をクリア) で削除とするか、
        // あるいは単純に intervals の最後をクリアした時点で削除とする。

        if (question.streak > intervals.length) {
            question.status = 'completed';
        } else {
            question.nextReviewDate = Date.now() + days * 24 * 60 * 60 * 1000;
        }
    } else {
        // 間違えたら最初から (あるいは1日後)
        question.streak = 0;
        question.nextReviewDate = Date.now() + 1 * 24 * 60 * 60 * 1000; // 1日後
    }

    await store.put(question);
    await tx.done;
}

export async function getStats() {
    const db = await initDB();
    const tx = db.transaction('questions', 'readonly');
    const store = tx.objectStore('questions');

    const all = await store.getAll();
    const active = all.filter(q => q.status === 'active').length;
    const completed = all.filter(q => q.status === 'completed').length;

    // 今日の復習待ち
    const now = Date.now();
    const review = all.filter(q => q.status === 'active' && q.nextReviewDate <= now).length;

    return { active, completed, review };
}
