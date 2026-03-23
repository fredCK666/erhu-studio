const DDG = require("duck-duck-scrape");
const OpenAI = require("openai");
const { onRequest } = require("firebase-functions/v2/https");
const yts = require("yt-search");

const courseData = {
  beginner: {
    label: "初級",
    overview: "初級重點是姿勢、長弓、切弦、節奏、音準和第一段完整演奏。",
    weeks: [
      { title: "姿勢與持琴重整", description: "重整坐姿、琴筒位置、握弓與身體放鬆感。", focus: ["先把持琴與握弓位置放正", "觀察肩膀是否放鬆", "用鏡子檢查身體角度"], tasks: ["完成 5 次姿勢檢查", "錄 30 秒持琴姿勢影片", "確認右手握弓不僵硬"] },
      { title: "基本長弓穩定", description: "練長弓平均、弓速控制與音色乾淨度。", focus: ["每個長弓要拉滿", "控制弓速平均", "避免音頭太重"], tasks: ["每天做 8 組長弓", "錄一段長音回聽", "穩定維持 4 拍長音"] },
      { title: "內外弦切換", description: "建立切弦手感，讓弓路乾淨不混亂。", focus: ["切弦動作要小", "手肘轉換不要甩", "保持聲音連續"], tasks: ["完成 4 組切弦循環", "配拍器做慢速切換", "回聽是否有雜音"] },
      { title: "節奏與短句", description: "用拍器把短句拉穩，建立拍點概念。", focus: ["句子先拆短", "拍點要穩", "短句收尾乾淨"], tasks: ["拍器下完成 8 小節", "每句至少重複 3 次", "避免中途停頓"] },
      { title: "左手按音基礎", description: "加入按音和簡單音階，開始建立音準感。", focus: ["手指落點要穩", "每個音都先聽準", "按音後肩膀仍放鬆"], tasks: ["完成上下行音階 4 次", "記錄最不穩的兩個音", "練完回聽音準"] },
      { title: "音階反覆校正", description: "反覆修正落點，讓耳朵和手指對齊。", focus: ["同一個音反覆確認", "先少量音再加長", "偏音要做記號"], tasks: ["每天做 2 輪音階校正", "錄音回聽 1 次", "標出偏高偏低位置"] },
      { title: "分弓與連弓", description: "把常見弓法放進簡單樂句中練習。", focus: ["分弓要清楚", "連弓要順", "句子不要斷掉"], tasks: ["同一句做分弓版與連弓版", "比較音色差異", "完整錄一段"] },
      { title: "基礎旋律整合", description: "開始把姿勢、節奏和音準放進旋律。", focus: ["保持完整旋律感", "音準與節奏同時顧", "不要只顧單點"], tasks: ["完成一段短旋律", "中途不停下", "錄音回看流暢度"] },
      { title: "完整段落演奏", description: "連續拉完一段短曲，不中斷完成。", focus: ["演奏不能中斷", "先求完整", "錯音先做記號"], tasks: ["完整拉完一段", "記錄卡住的位置", "第二次再修正"] },
      { title: "初級成果驗收", description: "錄下一段完整基礎演奏，作為初級收尾。", focus: ["從頭到尾完成", "維持姿勢與穩定", "留下成果版本"], tasks: ["錄一支完整版本", "聽一次並寫 3 個心得", "準備進入中級"] }
    ]
  },
  intermediate: {
    label: "中級",
    overview: "中級重點是換把、揉弦、音色、弓法組合、速度和段落控制。",
    weeks: [
      { title: "換把定位重整", description: "重新整理換把的目標音與手位移動。", focus: ["換把前先聽到目標音", "手型不要整個塌掉", "慢速把路徑做乾淨"], tasks: ["同一個換把句做 6 次", "先唱再拉", "標記最常偏掉的位置"] },
      { title: "揉弦穩定起步", description: "建立小幅度、可控制的揉弦動作。", focus: ["先求規律再求大", "手腕放鬆", "不要把音高揉散"], tasks: ["固定一個音做 30 秒揉弦", "分慢中兩種速度", "錄音比較前後穩定度"] },
      { title: "音色控制訓練", description: "練習不同力度和接觸位置造成的音色差異。", focus: ["比較靠弓根與弓中差異", "壓力不要過度", "追求乾淨和厚度平衡"], tasks: ["同一句做 3 種音色版本", "記下最好聽的一版", "保持音頭乾淨"] },
      { title: "弓法組合進階", description: "把分弓、連弓、重音放進更長的句子。", focus: ["弓法切換不要亂", "重音只放在需要的位置", "句子方向要一致"], tasks: ["拆成 2 小節練", "再連成 8 小節", "對照譜面做記號"] },
      { title: "中速節奏穩定", description: "從慢速跨到中速，保持節奏與音準不散。", focus: ["速度提升要分段", "先穩後快", "拍點不能被技巧拖走"], tasks: ["每次加 4 到 6 BPM", "同一速度做 3 輪", "不穩就退回上一級"] },
      { title: "段落與換氣感", description: "讓演奏不只正確，也開始有句子方向。", focus: ["想像句尾在哪裡", "每句要有出發和收束", "避免每音都一樣重"], tasks: ["每句先唱一次", "用弓速做起伏", "錄音檢查句尾是否自然"] },
      { title: "耐力與不中斷演奏", description: "提升中段演奏耐力與注意力維持。", focus: ["練習中段專注不掉", "呼吸要穩", "小失誤也不要停"], tasks: ["連續拉兩遍中段", "第二遍也保持音準", "記錄最容易散掉的地方"] },
      { title: "速度提升訓練", description: "逐步提高拍速，維持乾淨與穩定。", focus: ["每次只加一點點速度", "右手先放鬆", "左手落點要簡潔"], tasks: ["用拍器做階梯訓練", "保留一個安全速度", "每天只攻一個難句"] },
      { title: "技巧整合到曲目", description: "把換把、揉弦、弓法整合進完整段落。", focus: ["不要技巧和音樂分家", "難句先拆再回曲目", "段落前後要接得順"], tasks: ["挑一段完整段落練", "標記技巧點", "做一版表情版本"] },
      { title: "中級成果錄影", description: "完成一段具有表情和完整段落感的演奏。", focus: ["完整演奏不中斷", "表情和技術都要兼顧", "保留正式成果"], tasks: ["錄一支完成版", "寫下 3 個優點和 3 個待修正點", "準備進高級挑戰"] }
    ]
  },
  advanced: {
    label: "高級",
    overview: "高級重點是高速控制、音色設計、段落層次、困難段修正與舞台完整度。",
    weeks: [
      { title: "高強度長弓控制", description: "重新提升弓速、弓壓與音色統一性。", focus: ["大音量也要乾淨", "弓壓與弓速一起管", "同一句前後音色一致"], tasks: ["長弓做強弱對比", "回聽是否爆音", "保留最穩版本"] },
      { title: "快速換把與定位", description: "處理高速度下的手位準確與穩定。", focus: ["手指路徑要短", "換把前心裡先聽到音", "速度快也不能亂抓"], tasks: ["高速句拆成 2 音一組", "慢速對準後再加速", "記錄最常失準處"] },
      { title: "複合弓法連接", description: "把複雜弓法放在高難度片段中完成。", focus: ["複合弓法要先拆開", "重音與連弓銜接自然", "肢體不要多餘"], tasks: ["拆練弓型", "回到原句整合", "錄影看手臂路徑"] },
      { title: "揉弦與表情深化", description: "精修不同速度、不同情緒的揉弦效果。", focus: ["揉弦速度跟情緒一致", "不要每句都同一種揉法", "保留主旋律重點"], tasks: ["一段做 2 種情緒版本", "錄音比較差異", "選一種最適合的版本"] },
      { title: "高速度節奏穩定", description: "在更高拍速下維持乾淨、準確與放鬆。", focus: ["快但不要緊", "拍點穩定優先", "手部動作縮小"], tasks: ["用分段衝速法", "保留一個成功速度", "失控就退回安全速度"] },
      { title: "段落推進與層次", description: "設計樂句起伏、呼吸感和結構感。", focus: ["句子要有方向", "大段落不要平", "強弱變化要有理由"], tasks: ["譜上標註高點", "設計起伏弧線", "錄音檢查層次是否明顯"] },
      { title: "困難段拆解修正", description: "鎖定最難片段，做精準拆解練習。", focus: ["只練最難 2 到 4 小節", "問題要拆到夠小", "修好再回原段"], tasks: ["列出卡關清單", "一天只攻一個主問題", "完成後回完整段落測試"] },
      { title: "整首曲目連續演奏", description: "訓練從頭到尾不中斷完成曲目。", focus: ["整體體力分配", "中途失誤繼續走", "維持情緒連續"], tasks: ["完整跑一次全曲", "第二次修正卡點", "記錄尾段是否體力下降"] },
      { title: "錄影回看與舞台修正", description: "用錄影檢查音色、動作與舞台完整度。", focus: ["看動作是否乾淨", "看舞台狀態是否穩", "音色與畫面一致"], tasks: ["錄正式版本", "列 5 個修正點", "重錄對照改善"] },
      { title: "高級總驗收", description: "完成正式版本錄影，作為高級課程成果輸出。", focus: ["完整度第一", "細節穩定", "保留成果版本"], tasks: ["做正式錄影", "完成自我評估", "準備對外展示"] }
    ]
  }
};

function normalizeLevel(level) {
  return courseData[level] ? level : "beginner";
}

function normalizeWeek(week) {
  const value = Number(week);
  return value >= 1 && value <= 10 ? value : 1;
}

function buildKnowledge(level, week) {
  const levelKey = normalizeLevel(level);
  const weekNumber = normalizeWeek(week);
  const weekData = courseData[levelKey].weeks[weekNumber - 1];
  return {
    levelLabel: courseData[levelKey].label,
    weekNumber,
    weekTitle: weekData.title,
    overview: courseData[levelKey].overview,
    description: weekData.description,
    focus: weekData.focus,
    tasks: weekData.tasks
  };
}

function extractMediaTopic(question) {
  const cleaned = String(question || "")
    .replace(/給我看/g, "")
    .replace(/給我/g, "")
    .replace(/請給我/g, "")
    .replace(/請給/g, "")
    .replace(/幫我找/g, "")
    .replace(/幫我看/g, "")
    .replace(/我要/g, "")
    .replace(/想看/g, "")
    .replace(/有沒有/g, "")
    .replace(/點擊率最高的/g, "")
    .replace(/觀看數最高的/g, "")
    .replace(/最熱門的/g, "")
    .replace(/二胡教學影片/g, "")
    .replace(/教學影片/g, "")
    .replace(/影片/g, "")
    .replace(/簡譜/g, "")
    .replace(/樂譜/g, "")
    .replace(/圖片/g, "")
    .replace(/照片/g, "")
    .replace(/譜/g, "")
    .replace(/二胡/g, "")
    .replace(/video|youtube/gi, "")
    .replace(/[？?。!！]/g, "")
    .trim();
  return cleaned || "二胡教學";
}

function wantsImage(question) {
  return /簡譜|樂譜|譜|圖片|照片/.test(String(question || ""));
}

function wantsVideo(question) {
  return /教學影片|影片|video|youtube/.test(String(question || ""));
}

function shouldUseCourseContext(question) {
  return /初級|中級|高級|第\s*([1-9]|10)\s*週|訓練|課程|打卡|測驗/.test(String(question || ""));
}

function dedupeResources(items, keyGetter) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyGetter(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function searchScoreImages(topic) {
  const queries = [
    topic + " 二胡簡譜",
    topic + " 二胡 譜",
    topic + " 簡譜",
    topic + " 樂譜"
  ];
  const allResults = [];

  for (const query of queries) {
    try {
      const imageResults = await DDG.searchImages(query, {
        safeSearch: DDG.SafeSearchType.OFF,
        locale: "zh-TW"
      });
      allResults.push(...(imageResults.results || []));
    } catch (error) {
      console.error("searchImages failed", query, error);
    }
  }

  return dedupeResources(
    allResults
      .filter((item) => item && (item.image || item.thumbnail) && item.url)
      .sort((left, right) => (right.width || 0) * (right.height || 0) - (left.width || 0) * (left.height || 0)),
    (item) => item.image || item.thumbnail || item.url
  ).slice(0, 6);
}

async function buildMediaResources(question) {
  const q = String(question || "");
  const topic = extractMediaTopic(q);
  const resources = [];

  if (wantsImage(q)) {
    try {
      const bestImages = await searchScoreImages(topic);
      bestImages.forEach((bestImage, index) => {
        resources.push({
          kind: "image",
          label: index === 0 ? "相關簡譜圖片" : "更多譜圖",
          title: bestImage.title || (topic + " 二胡簡譜"),
          imageUrl: bestImage.image || bestImage.thumbnail,
          thumbnailUrl: bestImage.thumbnail,
          url: bestImage.url,
          source: bestImage.source
        });
      });
    } catch (error) {
      console.error("searchScoreImages failed", error);
    }
  }

  if (wantsVideo(q)) {
    try {
      const videoResults = await yts(topic + " 二胡 教學");
      const bestVideo = (videoResults.videos || [])
        .filter((item) => item && item.videoId && item.url)
        .sort((left, right) => (right.views || 0) - (left.views || 0))[0];
      if (bestVideo) {
        resources.push({
          kind: "video",
          label: "熱門教學影片",
          title: bestVideo.title,
          url: bestVideo.url,
          embedUrl: "https://www.youtube.com/embed/" + bestVideo.videoId,
          thumbnailUrl: bestVideo.image || bestVideo.thumbnail,
          viewCount: bestVideo.views || 0
        });
      }
    } catch (error) {
      console.error("yt-search failed", error);
    }
  }

  if (!resources.length && wantsImage(q)) {
    resources.push({
      kind: "search-link",
      label: "圖片搜尋",
      title: topic + " 二胡簡譜",
      url: "https://www.google.com/search?tbm=isch&q=" + encodeURIComponent(topic + " 二胡 簡譜")
    });
  }

  if (!resources.length && wantsVideo(q)) {
    resources.push({
      kind: "video-search",
      label: "相關影片",
      title: topic + " 二胡教學影片",
      previewText: topic + " 二胡教學影片",
      url: "https://www.youtube.com/results?search_query=" + encodeURIComponent(topic + " 二胡 教學")
    });
  }

  return resources;
}

function buildMessages(body, knowledge) {
  const recentHistory = Array.isArray(body.history) ? body.history.slice(-6) : [];
  const historyMessages = recentHistory
    .filter((item) => item && (item.role === "user" || item.role === "assistant") && item.text)
    .map((item) => ({ role: item.role, content: item.text }));
  const studentProfile = body.studentProfile || {};
  const trackerSummary = studentProfile.trackerSummary || {};
  const quizSummary = studentProfile.quizSummary || {};
  const currentLevelKey = normalizeLevel(body.level);
  const currentTracker = trackerSummary[currentLevelKey];
  const currentQuiz = quizSummary[currentLevelKey];
  const weakWeeks = currentQuiz && Array.isArray(currentQuiz.weakWeeks) && currentQuiz.weakWeeks.length
    ? currentQuiz.weakWeeks.join("、")
    : "目前沒有明顯弱項週次資料";

  const systemMessages = [
    {
      role: "system",
      content:
        "你是二胡小教室的 AI 助教。回答請使用繁體中文。先直接回答使用者問題本身，不要每次都硬套初級、中級、高級或固定模板。只有當問題明確提到等級、週次、課程、訓練內容時，才引用課程資訊。若學生在問簡譜、圖片或影片，回答要簡短直接，並提醒他看下方顯示的相關圖片或影片。"
    },
    {
      role: "system",
      content:
        "目前學生學習摘要：" +
        "\n學生姓名：" + (studentProfile.displayName || "未提供") +
        "\n本等級打卡完成週數：" + (typeof currentTracker === "number" ? currentTracker + "/10" : "尚無資料") +
        "\n本等級最近一次測驗：" + (currentQuiz && currentQuiz.last != null ? currentQuiz.last + "/10" : "尚無資料") +
        "\n本等級最佳測驗：" + (currentQuiz && currentQuiz.best != null ? currentQuiz.best + "/10" : "尚無資料") +
        "\n本等級較弱週次：" + weakWeeks
    }
  ];

  if (shouldUseCourseContext(body.question)) {
    systemMessages.push({
      role: "system",
      content:
        "目前課程上下文：" +
        "\n等級：" + knowledge.levelLabel +
        "\n週次：第 " + knowledge.weekNumber + " 週" +
        "\n主題：" + knowledge.weekTitle +
        "\n整體目標：" + knowledge.overview +
        "\n本週描述：" + knowledge.description +
        "\n本週重點：" + knowledge.focus.join("、") +
        "\n本週任務：" + knowledge.tasks.join("、")
    });
  }

  return systemMessages.concat(historyMessages).concat([
    {
      role: "user",
      content: String(body.question || "").trim()
    }
  ]);
}

exports.askErhuTutor = onRequest({ region: "asia-east1", secrets: ["OPENAI_API_KEY"], cors: true, invoker: "public" }, async (request, response) => {
  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }
  if (request.method !== "POST") {
    response.status(405).json({ error: "method-not-allowed" });
    return;
  }

  const question = String((request.body && request.body.question) || "").trim();
  if (!question) {
    response.status(400).json({ error: "missing-question" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    response.status(500).json({ error: "missing-openai-key" });
    return;
  }

  const knowledge = buildKnowledge(request.body.level, request.body.week);
  const client = new OpenAI({ apiKey });

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: buildMessages(request.body, knowledge)
    });

    const text = completion.choices &&
      completion.choices[0] &&
      completion.choices[0].message &&
      completion.choices[0].message.content
      ? completion.choices[0].message.content.trim()
      : "";

    const resources = await buildMediaResources(request.body.question);
    let answer = text || "目前沒有拿到有效回覆，請再問一次。";

    if (wantsImage(question) && resources.some((item) => item.kind === "image")) {
      answer = "我幫你找了相關的二胡譜圖，直接看下面的圖片就可以。";
    } else if (wantsImage(question)) {
      answer = "我這次沒有抓到合適的真實譜圖，你可以先點下面的圖片搜尋，我再幫你換別的關鍵字找。";
    } else if (wantsVideo(question) && resources.some((item) => item.kind === "video")) {
      answer = "我幫你找了相關的教學影片，直接看下面的影片就可以。";
    } else if (wantsVideo(question)) {
      answer = "我這次沒有抓到合適的影片，你可以先點下面的影片搜尋，我再幫你換別的關鍵字找。";
    }

    response.json({
      answer: answer,
      source: "openai",
      resources: resources
    });
  } catch (error) {
    console.error("askErhuTutor failed", error);
    response.status(500).json({
      error: "openai-request-failed",
      message: error && error.message ? error.message : "unknown-error"
    });
  }
});
