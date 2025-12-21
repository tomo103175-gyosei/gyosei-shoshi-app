import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
    let tempFilePath = null;

    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json({ error: "ファイルがアップロードされていません" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "APIキーが設定されていません" }, { status: 500 });
        }

        // 一時ファイルとして保存
        const buffer = Buffer.from(await file.arrayBuffer());
        const tempDir = tmpdir();
        const fileName = `upload-${Date.now()}.pdf`;
        tempFilePath = join(tempDir, fileName);

        await writeFile(tempFilePath, buffer);

        // Geminiにアップロード
        const fileManager = new GoogleAIFileManager(apiKey);
        const uploadResult = await fileManager.uploadFile(tempFilePath, {
            mimeType: "application/pdf",
            displayName: file.name,
        });

        const genAI = new GoogleGenerativeAI(apiKey);
        // ★修正点1: 確実に動くモデル名に変更
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
      あなたは行政書士試験の専門家です。
      提供されたPDFファイル（過去問や学習資料）の内容に基づいて、行政書士試験レベルの5択問題を1問作成してください。
      
      ## 指示
      1. **出題範囲**: 提供されたPDFの内容に関連する問題を作成すること。
      2. **難易度と形式**: 本試験レベルの5択問題。
      3. **解説**: テキストの内容を引用・参照しつつ、正確な法的根拠（条文・判例）を示して解説すること。
      4. **出力**: 以下のJSON形式のみを出力すること。

      ## JSONスキーマ
      {
        "question": "問題文",
        "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4", "選択肢5"],
        "correctIndex": 0,
        "explanation": "解説文",
        "reference": "根拠条文・情報源"
      }
    `;

        // ★修正点2: JSONモードを強制する書き方に変更
        const result = await model.generateContent({
            contents: [{
                role: "user",
                parts: [
                    {
                        fileData: {
                            mimeType: uploadResult.file.mimeType,
                            fileUri: uploadResult.file.uri
                        }
                    },
                    { text: prompt }
                ]
            }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const responseText = result.response.text();

        // 一時ファイルの削除
        if (tempFilePath) {
            await unlink(tempFilePath).catch(e => console.error("Temp file cleanup error:", e));
        }

        try {
            const quizData = JSON.parse(responseText);
            return NextResponse.json(quizData);
        } catch (e) {
            console.error("JSON Parse Error:", responseText); // エラー時にログを出す
            return NextResponse.json(
                { error: "AIからの応答の解析に失敗しました" },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error("PDF processing error:", error);
        if (tempFilePath) {
            await unlink(tempFilePath).catch(e => console.error("Temp file cleanup error:", e));
        }
        return NextResponse.json(
            { error: "処理中にエラーが発生しました: " + error.message },
            { status: 500 }
        );
    }
}