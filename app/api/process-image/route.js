
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
        // 拡張子を取得 (簡易的)
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `upload-img-${Date.now()}.${ext}`;
        tempFilePath = join(tempDir, fileName);

        await writeFile(tempFilePath, buffer);

        // Geminiにアップロード
        const fileManager = new GoogleAIFileManager(apiKey);
        const uploadResult = await fileManager.uploadFile(tempFilePath, {
            mimeType: file.type || "image/jpeg",
            displayName: file.name,
        });

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
      あなたは行政書士試験の専門家です。
      提供された画像（問題集の写真や手書きメモなど）から問題を読み取り、以下のJSON形式で出力してください。
      画像に複数の問題が含まれる場合は、最初に見つかった1問、または最も主要な1問を抽出してください。

      ## 指示
       1. 画像から問題文、正解、解説を読み取るか、解説がなければ知識に基づいて補足すること。
       2. 問題形式に応じて、正解を以下のいずれかで出力すること:
          - ◯☓問題の場合: "O" または "X"
          - 5肢択一などの多肢選択問題の場合: 正解の番号 ("1"〜"5" の半角数字)
       3. 解説は法的根拠を含めて詳細に記述すること。
       4. 出力はJSONのみ。

       ## JSONスキーマ
       {
         "text": "問題文",
         "correctAnswer": "O", // または "X", "1", "2", "3", "4", "5"
         "explanation": "解説文"
       }
    `;

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
            // 配列で返すことを期待される場合も考慮し、単一オブジェクトなら配列に入れる
            return NextResponse.json([quizData]);
        } catch (e) {
            console.error("JSON Parse Error:", responseText);
            return NextResponse.json(
                { error: "AIからの応答の解析に失敗しました" },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error("Image processing error:", error);
        if (tempFilePath) {
            await unlink(tempFilePath).catch(e => console.error("Temp file cleanup error:", e));
        }
        return NextResponse.json(
            { error: "処理中にエラーが発生しました: " + error.message },
            { status: 500 }
        );
    }
}
