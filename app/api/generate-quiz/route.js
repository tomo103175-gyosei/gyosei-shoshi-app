import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { category } = await request.json();

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "API key not configured" },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Use gemini-2.5-flash for speed, or pro for quality. flash implies speed which is good for interactive quiz.
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const categoryMap = {
            constitution: "憲法",
            administrative: "行政法",
            civil: "民法",
            commercial: "商法・会社法"
        };

        // Default to 'General Law' if no specific category or arbitrary string
        const categoryName = categoryMap[category] || "行政書士試験全般";

        const prompt = `
      あなたは行政書士試験の試験委員です。
      「${categoryName}」の分野から、本試験レベルの5択問題を1問作成してください。
      
      ## 必須要件
      1. **難易度**: 行政書士試験の過去問と同等のレベル。初学者向けのような簡単すぎる問題は避けること。
      2. **形式**: 問題文があり、5つの選択肢から「正しいもの」または「誤っているもの」を選ばせる形式など。
      3. **裏取り**: 解説は必ず根拠となる「条文（第○条）」や「重要判例（事件名や年月日）」を明記し、法的な正確性を担保すること。
      4. **出力**: 以下のJSONスキーマに厳密に従うこと。

      ## JSONスキーマ
      {
        "question": "問題文のテキスト",
        "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4", "選択肢5"],
        "correctIndex": 0, // 正解の選択肢のインデックス (0〜4の整数)
        "explanation": "正解の理由および各選択肢の解説。なぜ正解なのか、なぜ他が誤りなのかを論理的に記述。",
        "reference": "根拠となる条文名・番号、判例名など"
      }
    `;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const responseText = result.response.text();

        try {
            const quizData = JSON.parse(responseText);
            return NextResponse.json(quizData);
        } catch (e) {
            console.error("Failed to parse JSON from Gemini:", responseText);
            // Fallback or retry logic could go here, but for now return error
            return NextResponse.json(
                { error: "Failed to parse generated quiz data" },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error("Quiz generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate quiz. Please try again." },
            { status: 500 }
        );
    }
}
