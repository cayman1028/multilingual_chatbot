import { v2 } from "@google-cloud/translate"

export default async function handler(req, res) {
  // CORSヘッダーを設定
  res.setHeader("Access-Control-Allow-Credentials", true)
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST")
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  )

  // OPTIONSリクエスト（プリフライトリクエスト）への対応
  if (req.method === "OPTIONS") {
    res.status(200).end()
    return
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { text, targetLanguage } = req.body

    if (!text) {
      return res.status(400).json({ error: "Text is required" })
    }

    // Google Cloud Translation APIの初期化
    const translate = new v2.Translate({
      key: process.env.GOOGLE_API_KEY,
      projectId: process.env.GOOGLE_PROJECT_ID,
    })

    // 言語の自動検出
    const [detectionResult] = await translate.detect(text)
    const sourceLanguage = Array.isArray(detectionResult) ? detectionResult[0].language : detectionResult.language

    // 翻訳先言語が指定されていない場合、日本語をデフォルトとする
    const target = targetLanguage || "ja"

    // 翻訳元言語と翻訳先言語が同じ場合は翻訳せずにそのまま返す
    if (sourceLanguage === target) {
      return res.status(200).json({
        translatedText: text,
        sourceLanguage,
        targetLanguage: target,
      })
    }

    // テキストを翻訳
    const [translation] = await translate.translate(text, target)

    // 結果を返す
    res.status(200).json({
      translatedText: translation,
      sourceLanguage,
      targetLanguage: target,
    })
  } catch (error) {
    console.error("Translation error:", error)
    res.status(500).json({ error: "Translation failed", details: error.message })
  }
}
