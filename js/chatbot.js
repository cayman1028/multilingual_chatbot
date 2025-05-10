/**
 * シンプルなチャットボット
 */

;(() => {
  // DOMが完全に読み込まれた後に実行
  document.addEventListener("DOMContentLoaded", () => {
    // JSONファイルからチャットボットの設定を読み込む
    fetch("chatbot-data.json")
      .then((response) => response.json())
      .then((data) => {
        window.chatbotConfig = data
        initChatbot()
      })
      .catch((error) => {
        console.error("チャットボットの設定が読み込めませんでした。", error)
        // フォールバックとして静的なデータを使用
        window.chatbotConfig = {
          name: "アーバンハーモニー東京 コンシェルジュ",
          welcomeMessage: "申し訳ありません、データの読み込みに失敗しました。フロントデスクにお問い合わせください。",
          suggestedQuestions: [],
          qaDatabase: [],
          fallbackMessage: "データの読み込みに失敗しました。",
        }
        initChatbot()
      })
  })

  function initChatbot() {
    if (document.querySelector(".chatbot-container")) {
      return
    }

    const chatbotConfig = window.chatbotConfig

    // チャットボットのHTML構造を作成
    const chatbotHTML = `
      <div class="chatbot-container">
        <div class="chatbot-button">
          <div class="chatbot-icon">
            <div class="chatbot-speech-bubble">
              <div class="chatbot-dots">
                <div class="chatbot-dot"></div>
                <div class="chatbot-dot"></div>
                <div class="chatbot-dot"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="chatbot-window">
          <div class="chatbot-header">
            <div>${chatbotConfig.name}</div>
            <div class="chatbot-close">×</div>
          </div>
          <div class="chatbot-messages"></div>
          <div class="chatbot-input-container">
            <input type="text" class="chatbot-input" placeholder="メッセージを入力...">
            <button class="chatbot-send-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `

    // チャットボットをページに追加
    const chatbotContainer = document.createElement("div")
    chatbotContainer.innerHTML = chatbotHTML
    document.body.appendChild(chatbotContainer)

    // 要素の参照を取得
    const chatbotButton = document.querySelector(".chatbot-button")
    const chatbotWindow = document.querySelector(".chatbot-window")
    const chatbotClose = document.querySelector(".chatbot-close")
    const chatbotMessages = document.querySelector(".chatbot-messages")
    const chatbotInput = document.querySelector(".chatbot-input")
    const chatbotSendButton = document.querySelector(".chatbot-send-button")

    // 会話の履歴を保存
    const conversationHistory = []
    // 前回の質問と回答を記録
    let lastQuestion = ""
    let lastAnswer = ""

    // チャットボットの開閉
    chatbotButton.addEventListener("click", () => {
      chatbotWindow.style.display = "flex"

      // 初回表示時にメッセージを表示
      if (chatbotMessages.children.length === 0) {
        initChat()
      }
    })

    // 閉じるボタンのクリックイベント
    chatbotClose.addEventListener("click", (e) => {
      e.stopPropagation()
      chatbotWindow.style.display = "none"
    })

    // 送信ボタンのクリックイベント
    chatbotSendButton.addEventListener("click", handleUserInput)

    // 入力フィールドのEnterキーイベント
    chatbotInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleUserInput()
      }
    })

    // ユーザー入力を処理
    function handleUserInput() {
      const userInput = chatbotInput.value.trim()
      if (userInput === "") return

      // ユーザーの質問を表示
      addUserMessage(userInput)
      chatbotInput.value = ""

      // 会話履歴に追加
      conversationHistory.push({ role: "user", content: userInput })
      lastQuestion = userInput

      // 入力中表示を追加
      showTypingIndicator()

      // 少し遅延させて回答を表示
      setTimeout(() => {
        // 入力中表示を削除
        hideTypingIndicator()

        // 回答を検索して表示
        const answer = findAnswer(userInput)
        addBotMessage(answer)
        lastAnswer = answer

        // 会話履歴に追加
        conversationHistory.push({ role: "bot", content: answer })

        // 提案質問があれば表示
        if (
          chatbotConfig.suggestedQuestions &&
          chatbotConfig.suggestedQuestions.length > 0 &&
          conversationHistory.length <= 3
        ) {
          setTimeout(() => {
            showSuggestedQuestions()
          }, 1000)
        }
      }, 1000)
    }

    // 提案質問を表示
    function showSuggestedQuestions() {
      const suggestionsElement = document.createElement("div")
      suggestionsElement.className = "chatbot-message chatbot-message-bot chatbot-suggestions"

      let suggestionsHTML = "よく聞かれる質問：<br>"

      // ランダムに3つの質問を選択
      const randomQuestions = []
      const allQuestions = [...chatbotConfig.suggestedQuestions]

      for (let i = 0; i < Math.min(3, allQuestions.length); i++) {
        const randomIndex = Math.floor(Math.random() * allQuestions.length)
        randomQuestions.push(allQuestions[randomIndex])
        allQuestions.splice(randomIndex, 1)
      }

      randomQuestions.forEach((question, index) => {
        suggestionsHTML += `<div class="chatbot-suggestion" data-question="${question}">${question}</div>`
      })

      suggestionsElement.innerHTML = suggestionsHTML
      chatbotMessages.appendChild(suggestionsElement)

      // 提案質問のクリックイベント
      const suggestionElements = document.querySelectorAll(".chatbot-suggestion")
      suggestionElements.forEach((element) => {
        element.addEventListener("click", () => {
          const question = element.getAttribute("data-question")
          chatbotInput.value = question
          handleUserInput()
        })
      })

      scrollToBottom()
    }

    // 質問から回答を検索
    function findAnswer(question) {
      // 質問を小文字に変換
      const normalizedQuestion = question.toLowerCase()

      // 会話の文脈を考慮
      const context = getConversationContext()

      // 最も関連性の高い回答を検索
      let bestMatch = null
      let highestScore = 0
      let secondBestMatch = null
      let secondHighestScore = 0

      // 特定のキーワードに対する直接的な回答を検索
      for (const qa of chatbotConfig.qaDatabase) {
        // 基本的な関連性スコアを計算
        let score = calculateRelevanceScore(normalizedQuestion, qa.keywords)

        // 文脈に基づいてスコアを調整
        if (context && context.topic) {
          // 同じトピックの場合はボーナス
          if (qa.id === context.topic) {
            score += 0.2
          }

          // 関連トピックの場合も少しボーナス
          if (isRelatedTopic(qa.id, context.topic)) {
            score += 0.1
          }
        }

        // 前回と同じ回答を避ける（スコアが僅差の場合）
        if (qa.answer === lastAnswer && score < 0.8) {
          score -= 0.1
        }

        if (score > highestScore) {
          secondBestMatch = bestMatch
          secondHighestScore = highestScore
          highestScore = score
          bestMatch = qa
        } else if (score > secondHighestScore) {
          secondHighestScore = score
          secondBestMatch = qa
        }
      }

      // スコアが一定以上なら回答を返す
      if (highestScore > 0.1) {
        // スコアが僅差の場合、バリエーションを持たせるために時々2番目の回答を使用
        if (secondBestMatch && highestScore - secondHighestScore < 0.2 && Math.random() < 0.3) {
          return secondBestMatch.answer
        }
        return bestMatch.answer
      } else {
        // 特定のキーワードが見つからない場合、一般的な質問として処理
        return handleGeneralQuestion(normalizedQuestion)
      }
    }

    // 関連トピックかどうかを判定
    function isRelatedTopic(topicA, topicB) {
      const relatedTopics = {
        hotel_info: ["check_in_out", "location", "facilities", "room_types"],
        check_in_out: ["hotel_info", "payment"],
        location: ["station_access", "airport_access", "sightseeing_access", "convenience"],
        airport_access: ["location", "station_access"],
        station_access: ["location", "airport_access", "sightseeing_access"],
        sightseeing_access: ["location", "station_access"],
        restaurant: ["nearby_restaurant", "breakfast"],
        nearby_restaurant: ["restaurant", "convenience"],
        convenience: ["nearby_restaurant", "shopping", "location"],
        shopping: ["convenience", "nearby_restaurant"],
        wifi: ["hotel_info", "facilities"],
        breakfast: ["restaurant", "hotel_info"],
        facilities: ["hotel_info", "wifi"],
        payment: ["check_in_out", "hotel_info"],
        room_types: ["hotel_info", "facilities"],
        greeting: ["help", "hotel_info"],
        thanks: ["greeting", "bye"],
        bye: ["thanks"],
        help: ["hotel_info", "greeting"],
      }

      return relatedTopics[topicA] && relatedTopics[topicA].includes(topicB)
    }

    // 一般的な質問を処理
    function handleGeneralQuestion(question) {
      // 短い質問や単語のみの場合、関連するトピックを探す
      if (question.length < 10) {
        for (const qa of chatbotConfig.qaDatabase) {
          if (qa.id.toLowerCase().includes(question) || question.includes(qa.id.toLowerCase())) {
            return qa.answer
          }

          // テキストにも一致するか確認
          if (qa.text.toLowerCase().includes(question) || question.includes(qa.text.toLowerCase())) {
            return qa.answer
          }
        }
      }

      return chatbotConfig.fallbackMessage
    }

    // 会話の文脈を取得
    function getConversationContext() {
      if (conversationHistory.length < 2) return null

      // 直前のボットの回答を取得
      const lastBotMessage = conversationHistory
        .slice()
        .reverse()
        .find((msg) => msg.role === "bot")

      if (!lastBotMessage) return null

      // ボットの回答に関連するトピックを特定
      for (const qa of chatbotConfig.qaDatabase) {
        if (lastBotMessage.content === qa.answer) {
          return { topic: qa.id }
        }
      }

      return null
    }

    // 関連性スコアを計算（0〜1の値、1が最も関連性が高い）
    function calculateRelevanceScore(question, keywords) {
      let score = 0
      let maxKeywordScore = 0

      // 質問を小文字に変換し、句読点を削除
      const normalizedQuestion = question.toLowerCase().replace(/[、。？！.,?!]/g, "")

      // 質問を単語に分割
      const questionWords = normalizedQuestion.split(/\s+/)

      for (const keyword of keywords) {
        let keywordScore = 0

        // 完全一致（最も高いスコア）
        if (normalizedQuestion === keyword) {
          keywordScore = 1.0
        }
        // 質問にキーワードが含まれる
        else if (normalizedQuestion.includes(keyword)) {
          keywordScore = 0.8
        }
        // キーワードが質問の先頭にある
        else if (normalizedQuestion.startsWith(keyword)) {
          keywordScore = 0.7
        }
        // キーワードが質問の末尾にある
        else if (normalizedQuestion.endsWith(keyword)) {
          keywordScore = 0.6
        }
        // 単語単位での一致
        else if (questionWords.includes(keyword)) {
          keywordScore = 0.5
        }
        // 部分一致（キーワードが3文字以上の場合）
        else if (keyword.length >= 3) {
          // 語幹一致（例：「できる」と「できますか」）
          if (normalizedQuestion.includes(keyword.substring(0, keyword.length - 1))) {
            keywordScore = 0.4
          }
          // 単語の一部が含まれる場合
          else {
            const keywordParts = keyword.split("")
            let partMatches = 0
            for (const part of keywordParts) {
              if (normalizedQuestion.includes(part)) {
                partMatches++
              }
            }

            // 50%以上の文字が一致する場合
            if (partMatches / keywordParts.length >= 0.5) {
              keywordScore = 0.3
            }
          }
        }

        // 最も高いキーワードスコアを記録
        if (keywordScore > maxKeywordScore) {
          maxKeywordScore = keywordScore
        }

        // 累積スコアに加算
        score += keywordScore
      }

      // 最終スコアは最大キーワードスコアと累積スコアの組み合わせ
      return Math.min(maxKeywordScore * 0.7 + (score / keywords.length) * 0.3, 1)
    }

    // チャットを初期化
    function initChat() {
      // ウェルカムメッセージを表示
      addBotMessage(chatbotConfig.welcomeMessage)

      // 会話履歴に追加
      conversationHistory.push({ role: "bot", content: chatbotConfig.welcomeMessage })

      // 提案質問があれば表示
      if (chatbotConfig.suggestedQuestions && chatbotConfig.suggestedQuestions.length > 0) {
        setTimeout(() => {
          showSuggestedQuestions()
        }, 1000)
      }
    }

    // ユーザーメッセージを追加
    function addUserMessage(text) {
      const messageElement = document.createElement("div")
      messageElement.className = "chatbot-message chatbot-message-user"
      messageElement.textContent = text
      chatbotMessages.appendChild(messageElement)
      scrollToBottom()
    }

    // ボットメッセージを追加
    function addBotMessage(text) {
      const messageElement = document.createElement("div")
      messageElement.className = "chatbot-message chatbot-message-bot"
      messageElement.innerHTML = text.replace(/\n/g, "<br>")
      chatbotMessages.appendChild(messageElement)
      scrollToBottom()
    }

    // 入力中インジケーターを表示
    function showTypingIndicator() {
      const typingElement = document.createElement("div")
      typingElement.className = "chatbot-typing"
      typingElement.innerHTML = `
        <div class="chatbot-typing-dot"></div>
        <div class="chatbot-typing-dot"></div>
        <div class="chatbot-typing-dot"></div>
      `
      typingElement.id = "chatbot-typing-indicator"
      chatbotMessages.appendChild(typingElement)
      scrollToBottom()
    }

    // 入力中インジケーターを非表示
    function hideTypingIndicator() {
      const typingElement = document.getElementById("chatbot-typing-indicator")
      if (typingElement) {
        typingElement.remove()
      }
    }

    // メッセージ欄を下にスクロール
    function scrollToBottom() {
      chatbotMessages.scrollTop = chatbotMessages.scrollHeight
    }
  }
})()
