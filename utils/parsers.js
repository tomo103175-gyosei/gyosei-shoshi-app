
import * as XLSX from 'xlsx';

/**
 * ファイルを受け取り、問題リストを返す
 * @param {File} file 
 * @returns {Promise<Array>} objects with { text, correctAnswer, explanation, source }
 */
export async function parseSpreadsheet(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // 最初のシートを使用
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // 配列の配列として取得 (header: 1 でA1, B1... をそのまま配列にする)
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                const questions = [];

                // ヘッダー行を探す (最初の10行くらい確認)
                let headerRowIndex = -1;
                let colMap = { text: -1, currectAnswer: -1, explanation: -1 };

                for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0) continue;

                    let found = false;
                    row.forEach((cell, idx) => {
                        if (typeof cell !== 'string') return;
                        const c = cell.trim();
                        if (c.includes('問題')) { colMap.text = idx; found = true; }
                        else if (c.includes('正解') || c === '答え') { colMap.correctAnswer = idx; found = true; }
                        else if (c.includes('解説')) { colMap.explanation = idx; found = true; }
                    });

                    if (found && colMap.text !== -1) {
                        headerRowIndex = i;
                        break;
                    }
                }

                // ヘッダーが見つからない場合はデフォルト A, B, C
                if (headerRowIndex === -1) {
                    colMap = { text: 0, correctAnswer: 1, explanation: 2 };
                    headerRowIndex = -1; // データは0行目から始まるかも
                }

                // 行ごとに解析
                for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0) continue;

                    const text = row[colMap.text];
                    let correctAnswer = row[colMap.correctAnswer];
                    const explanation = row[colMap.explanation];

                    if (!text) continue; // 問題文がない行は無視

                    // 正解データの正規化
                    if (correctAnswer !== undefined && correctAnswer !== null) {
                        correctAnswer = String(correctAnswer).trim();

                        correctAnswer = normalizeCorrectAnswer(correctAnswer);
                    }

                    // O/X または 1-5 以外はスキップ
                    if (correctAnswer !== 'O' && correctAnswer !== 'X' && !['1', '2', '3', '4', '5'].includes(correctAnswer)) {
                        console.warn(`Skipping row ${i + 1}: Invalid answer format`, row);
                        continue;
                    }

                    questions.push({
                        text: String(text),
                        correctAnswer: correctAnswer,
                        explanation: String(explanation || ''),
                        source: file.name
                    });
                }

                resolve(questions);
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
}

/**
 * 正解データを正規化する (O/X または "1"~"5")
 * @param {string|number} answer 
 * @returns {string} Normalized answer
 */
export function normalizeCorrectAnswer(answer) {
    if (answer === undefined || answer === null) return '';
    let str = String(answer).trim();

    // O/X 変換
    if (str === '◯' || str === '○' || str.toLowerCase() === 'o') return 'O';
    if (str === '☓' || str === '×' || str.toLowerCase() === 'x') return 'X';

    // 1-5 の数字の場合 (全角含む)
    const num = parseInt(str.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)));
    if (!isNaN(num) && num >= 1 && num <= 5) {
        return String(num);
    }

    return str;
}
