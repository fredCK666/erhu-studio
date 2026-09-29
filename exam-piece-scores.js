(function () {
  function normalizeTitle(text) {
    return String(text || "")
      .replace(/[《》]/g, "")
      .replace(/[()（）]/g, "")
      .replace(/\s+/g, "")
      .trim();
  }

  var pieces = {};
  var catalog = [];
  var OVERRIDE_PREFIX = "erhu_piece_score_override::";
  var DRAFT_PREFIX = "erhu_piece_score_draft::";
  var SCORE_DATA_REVISION = "20260611d";

  function storeKey(key, value) {
    if (!key) {
      return;
    }
    pieces[key] = value;
  }

  function register(title, data) {
    var payload = Object.assign({}, data || {}, { title: title });
    catalog.push(payload);
    storeKey(title, payload);
    storeKey(normalizeTitle(title), payload);
    (payload.aliases || []).forEach(function (alias) {
      storeKey(alias, payload);
      storeKey(normalizeTitle(alias), payload);
    });
    return payload;
  }

  function cloneData(value) {
    if (value == null) {
      return value;
    }
    return JSON.parse(JSON.stringify(value));
  }

  function getStorage() {
    try {
      return window.localStorage || null;
    } catch (error) {
      return null;
    }
  }

  function getOverrideKey(title) {
    var normalized = normalizeTitle(title);
    if (!normalized) {
      return "";
    }
    return OVERRIDE_PREFIX + normalized;
  }

  function getDraftKey(title) {
    var normalized = normalizeTitle(title);
    if (!normalized) {
      return "";
    }
    return DRAFT_PREFIX + normalized;
  }

  function shouldUseFreshScore() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      return params.get("freshScore") === "1";
    } catch (error) {
      return false;
    }
  }

  function readJsonFromStorage(storage, key) {
    var raw = storage.getItem(key);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function findRegisteredScore() {
    for (var index = 0; index < arguments.length; index += 1) {
      var key = arguments[index];
      if (!key) {
        continue;
      }
      if (pieces[key]) {
        return pieces[key];
      }
      var normalized = normalizeTitle(key);
      if (normalized && pieces[normalized]) {
        return pieces[normalized];
      }
    }
    return null;
  }

  function readOverride(title) {
    var storage = getStorage();
    var key = getOverrideKey(title);
    if (!storage || !key) {
      return null;
    }
    var payload = readJsonFromStorage(storage, key);
    if (!payload) {
      return null;
    }
    if (shouldUseFreshScore()) {
      return null;
    }
    if (payload._scoreUserSavedAt) {
      return payload;
    }
    if (payload._scoreDataRevision !== SCORE_DATA_REVISION) {
      storage.removeItem(key);
      return null;
    }
    return payload;
  }

  function saveOverride(title, data) {
    var storage = getStorage();
    var base = findRegisteredScore(title);
    var key = getOverrideKey(base ? base.title : title);
    if (!storage || !key || !data) {
      return false;
    }
    var payload = cloneData(data);
    payload.title = base ? base.title : (payload.title || title);
    payload._scoreDataRevision = SCORE_DATA_REVISION;
    payload._scoreUserSavedAt = new Date().toISOString();
    storage.setItem(key, JSON.stringify(payload));
    return true;
  }

  function readDraft(title) {
    var storage = getStorage();
    var base = findRegisteredScore(title);
    var key = getDraftKey(base ? base.title : title);
    if (!storage || !key) {
      return null;
    }
    var payload = readJsonFromStorage(storage, key);
    if (!payload || !payload._scoreDraftSavedAt) {
      return null;
    }
    return payload;
  }

  function saveDraft(title, data) {
    var storage = getStorage();
    var base = findRegisteredScore(title);
    var key = getDraftKey(base ? base.title : title);
    if (!storage || !key || !data) {
      return false;
    }
    var payload = cloneData(data);
    payload.title = base ? base.title : (payload.title || title);
    payload._scoreDataRevision = SCORE_DATA_REVISION;
    payload._scoreDraftSavedAt = new Date().toISOString();
    storage.setItem(key, JSON.stringify(payload));
    return true;
  }

  function clearDraft(title) {
    var storage = getStorage();
    var base = findRegisteredScore(title);
    var key = getDraftKey(base ? base.title : title);
    if (!storage || !key) {
      return false;
    }
    storage.removeItem(key);
    return true;
  }

  function clearOverride(title) {
    var storage = getStorage();
    var base = findRegisteredScore(title);
    var key = getOverrideKey(base ? base.title : title);
    if (!storage || !key) {
      return false;
    }
    storage.removeItem(key);
    clearDraft(title);
    return true;
  }

  function hasOverride(title) {
    return !!readOverride(title);
  }

  function getBaseScore() {
    return findRegisteredScore.apply(null, arguments);
  }

  function getEditableScore() {
    var score = getScore.apply(null, arguments);
    return cloneData(score);
  }

  function listPieces() {
    return catalog.map(function (piece) {
      return {
        title: piece.title,
        aliases: cloneData(piece.aliases || []),
        note: piece.note || "",
        hasRows: Array.isArray(piece.rows) && piece.rows.length > 0
      };
    });
  }

  function getScore() {
    var base = findRegisteredScore.apply(null, arguments);
    if (!base) {
      return null;
    }
    var override = readOverride(base.title);
    return override || base;
  }

  function n(label, units) {
    return {
      label: label,
      units: units || 1
    };
  }

  function q(label) {
    return n(label, 4);
  }

  function e(label) {
    return n(label, 2);
  }

  function s(label) {
    return n(label, 1);
  }

  function h(label) {
    return n(label + "-", 8);
  }

  function w(label) {
    return n(label + "---", 16);
  }

  function measure(cells, options) {
    return Object.assign({ cells: cells }, options || {});
  }

  function span(start, end) {
    return [start, end];
  }

  function underline(start, end, depth) {
    return [start, end, depth || 1];
  }

  function guide(start, end, text) {
    return [start, end, text];
  }

  function bow(start, end, text) {
    return [start, end, text];
  }

  function fingering(start, end, text) {
    return [start, end, text];
  }

  function upperNote(start, end, text) {
    return [start, end, text];
  }

  register("連弓與附點音符練習（劉長福曲）", {
    aliases: ["連弓與附點音符練習"],
    note: "1=D｜2/4｜J=66｜站內版已保留連弓弧線與附點節奏顯示。",
    header: {
      number: "17.",
      title: "連弓與附點音符練習",
      left: ["1 = D（1 5 弦）", "♩ = 66"],
      right: "劉長福曲"
    },
    notation: [
      "1 2 3 4 5. 1 | 2 3 4 5 6. 2 | 3 4 5 6 7. 3 | 4 5 6 7 1'. 4 | 5 6 7 1' 2'. 7 | 1' 7 6 5 1'",
      "1' 7 6 5 4. 6 | 7 6 5 4 3. 5 | 6 5 4 3 2. 4 | 5 4 3 2 1 | 1. 5 2 5 6 5 | 3. 5 4 5 6 5",
      "5. 5 4 5 6 5 | 3. 5 2 5 6 5 | 1 5 1 5 3 5 1 5 | 2 5 1 5 3 5 1 5 | 4 6 1' 6 2 6 1' 6 | 3 6 1' 6 2 6 1' 6",
      "5 5 5 4 5 5 5 1 | 5 5 5 2 5 5 5 1 | 2 5 6 5 3 5 6 5 | 4 5 6 5 3 5 6 5 | 1 1' 7 6 5 4 3 2 | 1' 5 3 5 1'"
    ].join("\n"),
    rows: [
      {
        prefix: "2\n4",
        measures: [
          { cells: [n("1"), n("2"), n("3"), n("4"), n("5.", 3), n("1")], slurs: [[0, 3], [4, 5]], underlines: [[0, 3, 2], [4, 4, 1], [5, 5, 2]] },
          { cells: [n("2"), n("3"), n("4"), n("5"), n("6.", 3), n("2")], slurs: [[0, 3], [4, 5]], underlines: [[0, 3, 2], [4, 4, 1], [5, 5, 2]] },
          { cells: [n("3"), n("4"), n("5"), n("6"), n("7.", 3), n("3")], slurs: [[0, 3], [4, 5]], underlines: [[0, 3, 2], [4, 4, 1], [5, 5, 2]] },
          { cells: [n("4"), n("5"), n("6"), n("7"), n("1'.", 3), n("4")], slurs: [[0, 3], [4, 5]], underlines: [[0, 3, 2], [4, 4, 1], [5, 5, 2]] },
          { cells: [n("5"), n("6"), n("7"), n("1'"), n("2'.", 3), n("7")], slurs: [[0, 3], [4, 5]], underlines: [[0, 3, 2], [4, 4, 1], [5, 5, 2]] },
          { cells: [n("1'"), n("7"), n("6"), n("5"), n("1'", 4)], slurs: [[0, 3]], underlines: [[0, 3, 2]] }
        ]
      },
      {
        measures: [
          { cells: [n("1'"), n("7"), n("6"), n("5"), n("4.", 3), n("6")], slurs: [[0, 3], [4, 5]], underlines: [[0, 3, 2], [4, 4, 1], [5, 5, 2]] },
          { cells: [n("7"), n("6"), n("5"), n("4"), n("3.", 3), n("5")], slurs: [[0, 3], [4, 5]], underlines: [[0, 3, 2], [4, 4, 1], [5, 5, 2]] },
          { cells: [n("6"), n("5"), n("4"), n("3"), n("2.", 3), n("4")], slurs: [[0, 3], [4, 5]], underlines: [[0, 3, 2], [4, 4, 1], [5, 5, 2]] },
          { cells: [n("5"), n("4"), n("3"), n("2"), n("1", 4)], marker: "[10]", slurs: [[0, 3]], underlines: [[0, 3, 2]] },
          { cells: [n("1.", 3), n("5"), n("2"), n("5"), n("6"), n("5")], slurs: [[0, 1], [2, 5]], underlines: [[0, 0, 1], [1, 1, 2], [2, 5, 2]] },
          { cells: [n("3.", 3), n("5"), n("4"), n("5"), n("6"), n("5")], slurs: [[0, 1], [2, 5]], underlines: [[0, 0, 1], [1, 1, 2], [2, 5, 2]] }
        ]
      },
      {
        measures: [
          { cells: [n("5.", 3), n("5"), n("4"), n("5"), n("6"), n("5")], slurs: [[0, 1], [2, 5]], underlines: [[0, 0, 1], [1, 1, 2], [2, 5, 2]] },
          { cells: [n("3.", 3), n("5"), n("2"), n("5"), n("6"), n("5")], slurs: [[0, 1], [2, 5]], underlines: [[0, 0, 1], [1, 1, 2], [2, 5, 2]] },
          { cells: [n("1"), n("5"), n("1"), n("5"), n("3"), n("5"), n("1"), n("5")], slurs: [[0, 3], [4, 7]], underlines: [[0, 3, 2], [4, 7, 2]] },
          { cells: [n("2"), n("5"), n("1"), n("5"), n("3"), n("5"), n("1"), n("5")], slurs: [[0, 3], [4, 7]], underlines: [[0, 3, 2], [4, 7, 2]] },
          { cells: [n("4"), n("6"), n("1'"), n("6"), n("2"), n("6"), n("1'"), n("6")], slurs: [[0, 3], [4, 7]], underlines: [[0, 3, 2], [4, 7, 2]] },
          { cells: [n("3"), n("6"), n("1'"), n("6"), n("2"), n("6"), n("1'"), n("6")], slurs: [[0, 3], [4, 7]], underlines: [[0, 3, 2], [4, 7, 2]] }
        ]
      },
      {
        measures: [
          { cells: [n("5"), n("5"), n("5"), n("4"), n("5"), n("5"), n("5"), n("1")], slurs: [[0, 3], [4, 7]], underlines: [[0, 3, 2], [4, 7, 2]] },
          { cells: [n("5"), n("5"), n("5"), n("2"), n("5"), n("5"), n("5"), n("1")], marker: "[20]", slurs: [[0, 3], [4, 7]], underlines: [[0, 3, 2], [4, 7, 2]] },
          { cells: [n("2"), n("5"), n("6"), n("5"), n("3"), n("5"), n("6"), n("5")], slurs: [[0, 3], [4, 7]], underlines: [[0, 3, 2], [4, 7, 2]] },
          { cells: [n("4"), n("5"), n("6"), n("5"), n("3"), n("5"), n("6"), n("5")], slurs: [[0, 3], [4, 7]], underlines: [[0, 3, 2], [4, 7, 2]] },
          { cells: [n("1"), n("1'"), n("7"), n("6"), n("5"), n("4"), n("3"), n("2")], slurs: [[0, 3], [4, 7]], underlines: [[0, 3, 2], [4, 7, 2]] },
          { cells: [n("1'"), n("5"), n("3"), n("5"), n("1'", 4)], slurs: [[0, 3]], underlines: [[0, 3, 2]] }
        ]
      }
    ]
  });

  // `cells` 是音符本體，`guides` 是上方指法，`slurs` 是連弓。
  // `cells` 的索引從 0 開始算。
  // 例如第一小節 [q("1"), s("1"), s("1"), e("2"), e("3"), e("3"), q("2")]
  // 對應索引就是     0       1       2       3       4       5       6
  // 如果要自己精修下面的底線位置，把 `autoUnderlines` 改成 false，
  // 然後直接改各小節的 `underlines`。
  register("田園春色", {
    aliases: ["《田園春色》"],
    note: "1=D｜4/4｜行板",
    autoUnderlines: true,
    beatUnits: 4,
    header: {
      title: "田園春色",
      left: ["1 = D（1 5 弦）", "4/4｜行板"],
      right: "第一級自選曲"
    },
    notation: [
      "1 1 1 2 3 3 2 | 3 5 3 2 1 3 2- | 5 5 6 5 3 2 3",
      "2 1 2 3 5 3 2 1- | 5 5 5 6 1'. 2 6 | 6 1 5 6 1'. 2 6-",
      "1' 6 5 6 3 7 6 5 6 2 | 5 5 5 3 2 1- | 5. 6 1' 6 1 5 6 1'",
      "7 6 5 6 1'. 2 1'- | 7 6 5 6 4 4. 5 4 | 7 6 5 6 4. 5 4-",
      "4. 5 3 3 2. 3 2 2 | 3 2 1 2 3. 5 6- | 7 6 5 6 1' 6 1 6 5 3",
      "2 1 2 3 5 1 2 3- | 1 3 5 5 6 1' 5 5 | 7 6 5 6 1'. 2 5-",
      "5. 6 1' 6 1 6 5 3 | 2 1 2 3 5 3 2 1- | 1---"
    ].join("\n"),
    rows: [
      {
        prefix: "4\n4",
        measures: [
          // 第 1 行｜第 1 小節
          measure(
            [q("1"), s("1"), s("1"), e("2"), e("3"), e("3"), q("2")],
            {
              underlines: [underline(1, 2, 2), underline(3, 5, 1)],
              slurs: [span(1, 3), span(4, 5)],
              fingerings: [guide(0, 0, "0"), guide(4, 5, "5")]
            }
          ),
          // 第 1 行｜第 2 小節
          measure(
            [e("3"), e("5"), s("3"), s("2"), s("1"), s("3"), h("2")],
            {
              underlines: [underline(0, 1, 1), underline(2, 5, 2)],
              slurs: [span(0, 1), span(2, 5)],
              fingerings: [guide(0, 1, "三 四")]
            }
          ),
          // 第 1 行｜第 3 小節
          measure(
            [e("5"), e("5"), e("6"), e("5"), e("3"), e("2"), q("3")],
            {
              underlines: [underline(0, 1, 1), underline(2, 3, 1), underline(4, 5, 1)],
              slurs: [span(0, 1), span(2, 3), span(4, 5)],
              fingerings: [guide(0, 1, "0 四")]
            }
          )
        ]
      },
      {
        measures: [
          // 第 2 行｜第 1 小節
          measure(
            [s("2"), s("1"), e("2"), s("3"), s("5"), s("3"), s("2"), h("1")],
            {
              underlines: [underline(0, 1, 2), underline(2, 2, 1), underline(3, 6, 2)],
              slurs: [span(0, 2), span(3, 6)],
              fingerings: [guide(3, 6, "二 四")]
            }
          ),
          // 第 2 行｜第 2 小節
          measure(
            [e("5"), e("5"), e("5"), e("6"), n("1'.", 3), s("2"), q("6")],
            {
              marker: "f",
              underlines: [underline(0, 1, 1), underline(2, 3, 1), underline(4, 4, 1), underline(5, 5, 2)],
              slurs: [span(0, 1), span(2, 3), span(4, 5)],
              fingerings: [guide(0, 1, "0 四"), guide(4, 5, "三 四")]
            }
          ),
          // 第 2 行｜第 3 小節
          measure(
            [s("6"), s("1"), s("5"), s("6"), n("1'.", 3), s("2"), h("6")],
            {
              underlines: [underline(0, 3, 2), underline(4, 4, 1), underline(5, 5, 2)],
              slurs: [span(0, 3), span(4, 5)],
              fingerings: [guide(0, 3, "四"), guide(4, 5, "三 四")]
            }
          )
        ]
      },
      {
        measures: [
          // 第 3 行｜第 1 小節
          measure(
            [s("1'"), s("6"), s("5"), s("6"), q("3"), s("7"), s("6"), s("5"), s("6"), q("2")],
            {
              underlines: [underline(0, 3, 2), underline(5, 8, 2)],
              slurs: [span(0, 3), span(5, 8)],
              fingerings: [guide(0, 3, "四"), guide(5, 8, "三")]
            }
          ),
          // 第 3 行｜第 2 小節
          measure(
            [e("5"), e("5"), s("5"), s("3"), e("2"), h("1")],
            {
              underlines: [underline(0, 1, 1), underline(2, 3, 2), underline(4, 4, 1)],
              slurs: [span(0, 1), span(2, 4)],
              fingerings: [guide(0, 1, "0 四"), guide(2, 4, "四")]
            }
          ),
          // 第 3 行｜第 3 小節
          measure(
            [n("5.", 3), s("6"), q("1'"), s("6"), s("1"), s("5"), s("6"), q("1'")],
            {
              marker: "f",
              underlines: [underline(0, 0, 1), underline(1, 1, 2), underline(3, 6, 2)],
              slurs: [span(0, 1), span(3, 6)],
              fingerings: [guide(0, 1, "三"), guide(3, 6, "三")]
            }
          )
        ]
      },
      {
        measures: [
          // 第 4 行｜第 1 小節
          measure(
            [s("7"), s("6"), s("5"), s("6"), n("1'.", 3), s("2"), h("1'")],
            {
              underlines: [underline(0, 3, 2), underline(4, 4, 1), underline(5, 5, 2)],
              slurs: [span(0, 3), span(4, 5)],
              fingerings: [guide(0, 3, "三"), guide(4, 5, "四")]
            }
          ),
          // 第 4 行｜第 2 小節
          measure(
            [s("7"), s("6"), s("5"), s("6"), q("4"), n("4.", 3), s("5"), q("4")],
            {
              marker: "p",
              underlines: [underline(0, 3, 2), underline(5, 5, 1), underline(6, 6, 2)],
              slurs: [span(0, 3), span(5, 6)],
              fingerings: [guide(0, 3, "三"), guide(5, 6, "四")]
            }
          ),
          // 第 4 行｜第 3 小節
          measure(
            [s("7"), s("6"), s("5"), s("6"), n("4.", 3), s("5"), h("4")],
            {
              underlines: [underline(0, 3, 2), underline(4, 4, 1), underline(5, 5, 2)],
              slurs: [span(0, 3), span(4, 5)],
              fingerings: [guide(0, 3, "三"), guide(4, 5, "四")]
            }
          )
        ]
      },
      {
        measures: [
          // 第 5 行｜第 1 小節
          measure(
            [n("4.", 3), s("5"), e("3"), e("3"), n("2.", 3), s("3"), e("2"), e("2")],
            {
              underlines: [underline(0, 0, 1), underline(1, 1, 2), underline(2, 3, 1), underline(4, 4, 1), underline(5, 5, 2), underline(6, 7, 1)],
              slurs: [span(0, 1), span(4, 5)],
              fingerings: [guide(0, 1, "四"), guide(2, 3, "三"), guide(4, 5, "三")]
            }
          ),
          // 第 5 行｜第 2 小節
          measure(
            [s("3"), s("2"), s("1"), e("2"), n("3.", 3), s("5"), h("6")],
            {
              underlines: [underline(0, 2, 2), underline(3, 3, 1), underline(4, 4, 1), underline(5, 5, 2)],
              slurs: [span(0, 3), span(4, 5)],
              fingerings: [guide(5, 5, "0")]
            }
          ),
          // 第 5 行｜第 3 小節
          measure(
            [s("7"), s("6"), s("5"), s("6"), q("1'"), s("6"), s("1"), s("6"), s("5"), q("3")],
            {
              underlines: [underline(0, 3, 2), underline(5, 8, 2)],
              slurs: [span(0, 3), span(5, 8)],
              fingerings: [guide(0, 3, "三"), guide(5, 8, "三")]
            }
          )
        ]
      },
      {
        measures: [
          // 第 6 行｜第 1 小節
          measure(
            [s("2"), s("1"), e("2"), s("3"), s("5"), s("1"), s("2"), h("3")],
            {
              underlines: [underline(0, 1, 2), underline(2, 2, 1), underline(3, 6, 2)],
              slurs: [span(0, 2), span(3, 6)],
              fingerings: [guide(3, 6, "四")]
            }
          ),
          // 第 6 行｜第 2 小節
          measure(
            [e("1"), e("3"), e("5"), e("5"), e("6"), e("1'"), e("5"), e("5")],
            {
              underlines: [underline(0, 1, 1), underline(2, 3, 1), underline(4, 5, 1), underline(6, 7, 1)],
              slurs: [span(0, 1), span(2, 3), span(4, 5), span(6, 7)],
              fingerings: [guide(2, 3, "0 四"), guide(6, 7, "0 四")]
            }
          ),
          // 第 6 行｜第 3 小節
          measure(
            [s("7"), s("6"), s("5"), s("6"), n("1'.", 3), s("2"), h("5")],
            {
              underlines: [underline(0, 3, 2), underline(4, 4, 1), underline(5, 5, 2)],
              slurs: [span(0, 3), span(4, 5)],
              fingerings: [guide(4, 5, "三 四")]
            }
          )
        ]
      },
      {
        measures: [
          // 第 7 行｜第 1 小節
          measure(
            [n("5.", 3), s("6"), q("1'"), s("6"), s("1"), s("6"), s("5"), q("3")],
            {
              underlines: [underline(0, 0, 1), underline(1, 1, 2), underline(3, 6, 2)],
              slurs: [span(0, 1), span(3, 6)],
              fingerings: [guide(3, 6, "三")]
            }
          ),
          // 第 7 行｜第 2 小節
          measure(
            [s("2"), s("1"), e("2"), s("3"), s("5"), s("3"), s("2"), h("1")],
            {
              underlines: [underline(0, 1, 2), underline(2, 2, 1), underline(3, 6, 2)],
              slurs: [span(0, 2), span(3, 6)],
              fingerings: [guide(3, 6, "四")]
            }
          ),
          // 第 7 行｜第 3 小節
          measure([w("1")])
        ]
      }
    ]
  });

  register("紫竹調", {
  "aliases": [
    "紫竹调",
    "《紫竹調》"
  ],
  "header": {
    "title": "紫竹調",
    "left": [
      "1 = D（1–5 弦）",
      "2/4｜中速・優美地"
    ],
    "right": "滬劇曲牌\n劉和平 制譜（2023 年 5 月版）"
  },
  "beatUnits": 4,
  "autoUnderlines": false,
  "note": "1=D｜2/4｜依使用者提供的劉和平 2023 年 5 月版轉錄。跟譜目前按印刷順序練主音，不自動執行反覆與第一／第二結尾跳轉；倚音、波音、滑音以文字記號保留，不計入音準評分。漸慢請自行調整速度。",
  "rows": [
    {
      "prefix": "2\n4",
      "measures": [
        {
          "cells": [
            {
              "label": "6",
              "units": 2
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "2'",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            }
          ],
          "slurs": [
            [
              3,
              6
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              2,
              2
            ],
            [
              3,
              6,
              2
            ]
          ],
          "sourceMeasure": 1,
          "marker": "【一】中速・優美地／引子（"
        },
        {
          "cells": [
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            }
          ],
          "slurs": [],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 2
        },
        {
          "cells": [
            {
              "label": "6",
              "units": 2
            },
            {
              "label": "0",
              "units": 2
            },
            {
              "label": "6",
              "units": 2
            },
            {
              "label": "0",
              "units": 2
            }
          ],
          "slurs": [],
          "underlines": [
            [
              0,
              1,
              1
            ],
            [
              2,
              3,
              1
            ]
          ],
          "sourceMeasure": 3,
          "marker": "引子）"
        },
        {
          "cells": [
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 4,
          "marker": "滑入",
          "fingerings": [
            [
              4,
              4,
              "四"
            ]
          ],
          "bows": [
            [
              0,
              0,
              "ㄇ"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 5,
          "marker": "滑入",
          "fingerings": [
            [
              4,
              4,
              "四"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "2.",
              "units": 1.5
            },
            {
              "label": "3",
              "units": 0.5
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              0,
              2
            ],
            [
              1,
              1,
              3
            ],
            [
              2,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 6,
          "marker": "6 波音",
          "fingerings": [
            [
              2,
              2,
              "0"
            ]
          ]
        }
      ]
    },
    {
      "prefix": "",
      "measures": [
        {
          "cells": [
            {
              "label": "1.",
              "units": 3
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              5
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              1,
              2
            ],
            [
              2,
              5,
              2
            ]
          ],
          "sourceMeasure": 7
        },
        {
          "cells": [
            {
              "label": "3",
              "units": 2
            },
            {
              "label": "1'",
              "units": 4
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            }
          ],
          "slurs": [
            [
              2,
              3
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              2,
              3,
              2
            ]
          ],
          "sourceMeasure": 8,
          "marker": "3→1′ 上滑音",
          "fingerings": [
            [
              1,
              1,
              "三"
            ]
          ],
          "bows": [
            [
              0,
              0,
              "ㄇ"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "3.",
              "units": 3
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              5
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              1,
              2
            ],
            [
              2,
              5,
              2
            ]
          ],
          "sourceMeasure": 9,
          "marker": "前倚音 5",
          "fingerings": [
            [
              1,
              1,
              "四"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1",
              "units": 1
            },
            {
              "label": "2",
              "units": 4
            }
          ],
          "slurs": [
            [
              0,
              4
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ]
          ],
          "sourceMeasure": 10,
          "marker": "前倚音 6（波音）",
          "fingerings": [
            [
              0,
              0,
              "0"
            ]
          ],
          "bows": [
            [
              0,
              0,
              "V"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "3.",
              "units": 3
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              5
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              1,
              2
            ],
            [
              2,
              5,
              2
            ]
          ],
          "sourceMeasure": 11,
          "marker": "前倚音 5",
          "fingerings": [
            [
              1,
              1,
              "四"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "5.",
              "units": 6
            },
            {
              "label": "1",
              "units": 2
            }
          ],
          "slurs": [
            [
              0,
              1
            ]
          ],
          "underlines": [
            [
              1,
              1,
              1
            ]
          ],
          "sourceMeasure": 12,
          "fingerings": [
            [
              0,
              0,
              "0"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "1'",
              "units": 2
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "3.",
              "units": 1.5
            },
            {
              "label": "5",
              "units": 0.5
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              2
            ],
            [
              3,
              4
            ],
            [
              5,
              6
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              2,
              2
            ],
            [
              3,
              3,
              2
            ],
            [
              4,
              4,
              3
            ],
            [
              5,
              6,
              2
            ]
          ],
          "sourceMeasure": 13,
          "fingerings": [
            [
              3,
              3,
              "四"
            ]
          ],
          "bows": [
            [
              0,
              0,
              "V"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "5.",
              "units": 6
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            }
          ],
          "slurs": [
            [
              1,
              2
            ]
          ],
          "underlines": [
            [
              1,
              2,
              2
            ]
          ],
          "sourceMeasure": 14,
          "marker": "6 前倚音 1′",
          "fingerings": [
            [
              0,
              0,
              "0"
            ]
          ],
          "bows": [
            [
              0,
              0,
              "ㄇ"
            ]
          ]
        }
      ]
    },
    {
      "prefix": "",
      "measures": [
        {
          "cells": [
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 4
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              3,
              4
            ]
          ],
          "underlines": [
            [
              0,
              1,
              2
            ],
            [
              3,
              4,
              2
            ]
          ],
          "sourceMeasure": 15,
          "marker": "7 波音",
          "fingerings": [
            [
              0,
              0,
              "0"
            ],
            [
              2,
              2,
              "四"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "3",
              "units": 4
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              3
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ]
          ],
          "sourceMeasure": 16,
          "bows": [
            [
              0,
              0,
              "V"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "5",
              "units": 2
            },
            {
              "label": "2",
              "units": 2
            },
            {
              "label": "3",
              "units": 2
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              3,
              4
            ]
          ],
          "underlines": [
            [
              0,
              1,
              1
            ],
            [
              2,
              2,
              1
            ],
            [
              3,
              4,
              2
            ]
          ],
          "sourceMeasure": 17,
          "marker": "3 前倚音 5",
          "fingerings": [
            [
              0,
              0,
              "四"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "1.",
              "units": 6
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              2
            ]
          ],
          "underlines": [
            [
              1,
              2,
              2
            ]
          ],
          "sourceMeasure": 18
        },
        {
          "cells": [
            {
              "label": "1.",
              "units": 3
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "5",
              "units": 2
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              3,
              4
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              1,
              2
            ],
            [
              2,
              2,
              1
            ],
            [
              3,
              4,
              2
            ]
          ],
          "sourceMeasure": 19,
          "fingerings": [
            [
              2,
              2,
              "四"
            ]
          ],
          "bows": [
            [
              0,
              0,
              "ㄇ"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "1",
              "units": 1
            },
            {
              "label": "2",
              "units": 4
            }
          ],
          "slurs": [
            [
              0,
              3
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ]
          ],
          "sourceMeasure": 20,
          "marker": "2 前倚音 1、後倚音 5",
          "bows": [
            [
              0,
              0,
              "V"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "3",
              "units": 2
            },
            {
              "label": "5",
              "units": 4
            },
            {
              "label": "6",
              "units": 2
            }
          ],
          "slurs": [
            [
              0,
              1
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              2,
              2,
              1
            ]
          ],
          "sourceMeasure": 21,
          "marker": "前倚音 5",
          "fingerings": [
            [
              1,
              1,
              "四"
            ]
          ],
          "bows": [
            [
              0,
              0,
              "V"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "1'.",
              "units": 3
            },
            {
              "label": "2'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 2
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              4
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              1,
              2
            ],
            [
              2,
              3,
              2
            ],
            [
              4,
              4,
              1
            ]
          ],
          "sourceMeasure": 22,
          "fingerings": [
            [
              0,
              0,
              "四"
            ],
            [
              4,
              4,
              "0"
            ]
          ],
          "bows": [
            [
              0,
              0,
              "V"
            ]
          ]
        }
      ]
    },
    {
      "prefix": "",
      "measures": [
        {
          "cells": [
            {
              "label": "6",
              "units": 4
            },
            {
              "label": "-",
              "units": 4
            }
          ],
          "slurs": [],
          "underlines": [],
          "sourceMeasure": 23,
          "bows": [
            [
              0,
              0,
              "V"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "1.",
              "units": 3
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "5",
              "units": 2
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              3,
              4
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              1,
              2
            ],
            [
              2,
              2,
              1
            ],
            [
              3,
              4,
              2
            ]
          ],
          "sourceMeasure": 24,
          "fingerings": [
            [
              2,
              2,
              "四"
            ]
          ],
          "bows": [
            [
              0,
              0,
              "ㄇ"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "1",
              "units": 1
            },
            {
              "label": "2",
              "units": 4
            }
          ],
          "slurs": [
            [
              0,
              3
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ]
          ],
          "sourceMeasure": 25,
          "marker": "2 前倚音 1、後倚音 5",
          "bows": [
            [
              0,
              0,
              "V"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "3",
              "units": 2
            },
            {
              "label": "5",
              "units": 4
            },
            {
              "label": "6",
              "units": 2
            }
          ],
          "slurs": [
            [
              0,
              1
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              2,
              2,
              1
            ]
          ],
          "sourceMeasure": 26,
          "marker": "前倚音 5",
          "fingerings": [
            [
              1,
              1,
              "四"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "1'.",
              "units": 3
            },
            {
              "label": "2'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 2
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              4
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              1,
              2
            ],
            [
              2,
              3,
              2
            ],
            [
              4,
              4,
              1
            ]
          ],
          "sourceMeasure": 27,
          "fingerings": [
            [
              4,
              4,
              "0"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "6",
              "units": 4
            },
            {
              "label": "-",
              "units": 4
            }
          ],
          "slurs": [],
          "underlines": [],
          "sourceMeasure": 28,
          "bows": [
            [
              0,
              0,
              "V"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 29,
          "marker": "𝄆 反覆開始／6 波音",
          "fingerings": [
            [
              4,
              4,
              "0"
            ],
            [
              6,
              6,
              "四"
            ]
          ],
          "bows": [
            [
              0,
              0,
              "ㄇ"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "4",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 30,
          "marker": "6、3 波音"
        }
      ]
    },
    {
      "prefix": "",
      "measures": [
        {
          "cells": [
            {
              "label": "2.",
              "units": 1.5
            },
            {
              "label": "3",
              "units": 0.5
            },
            {
              "label": "4",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              5
            ],
            [
              6,
              7
            ]
          ],
          "underlines": [
            [
              0,
              0,
              2
            ],
            [
              1,
              1,
              3
            ],
            [
              2,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 31,
          "marker": "6 波音"
        },
        {
          "cells": [
            {
              "label": "1",
              "units": 4
            },
            {
              "label": "5.",
              "units": 3
            },
            {
              "label": "6",
              "units": 1
            }
          ],
          "slurs": [
            [
              1,
              2
            ]
          ],
          "underlines": [
            [
              1,
              1,
              1
            ],
            [
              2,
              2,
              2
            ]
          ],
          "sourceMeasure": 32,
          "bows": [
            [
              0,
              0,
              "V"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "3",
              "units": 2
            },
            {
              "label": "1'",
              "units": 2
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            }
          ],
          "slurs": [
            [
              1,
              5
            ]
          ],
          "underlines": [
            [
              0,
              1,
              1
            ],
            [
              2,
              5,
              2
            ]
          ],
          "sourceMeasure": 33,
          "marker": "1′ 前倚音 7",
          "bows": [
            [
              0,
              0,
              "V"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "3.",
              "units": 3
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              5
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              1,
              2
            ],
            [
              2,
              5,
              2
            ]
          ],
          "sourceMeasure": 34,
          "marker": "前倚音 5",
          "fingerings": [
            [
              1,
              1,
              "四"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "5",
              "units": 2
            },
            {
              "label": "1",
              "units": 2
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              5
            ]
          ],
          "underlines": [
            [
              0,
              1,
              1
            ],
            [
              2,
              5,
              2
            ]
          ],
          "sourceMeasure": 35,
          "fingerings": [
            [
              0,
              0,
              "0"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "3.",
              "units": 3
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              5
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              1,
              2
            ],
            [
              2,
              5,
              2
            ]
          ],
          "sourceMeasure": 36,
          "marker": "前倚音 5",
          "fingerings": [
            [
              1,
              1,
              "四"
            ]
          ],
          "bows": [
            [
              0,
              0,
              "V"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "5",
              "units": 2
            },
            {
              "label": "1",
              "units": 2
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              5
            ]
          ],
          "underlines": [
            [
              0,
              1,
              1
            ],
            [
              2,
              5,
              2
            ]
          ],
          "sourceMeasure": 37
        }
      ]
    },
    {
      "prefix": "",
      "measures": [
        {
          "cells": [
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              5
            ],
            [
              6,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 38,
          "fingerings": [
            [
              5,
              5,
              "四"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "5",
              "units": 2
            },
            {
              "label": "1",
              "units": 2
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            }
          ],
          "slurs": [
            [
              2,
              5
            ]
          ],
          "underlines": [
            [
              0,
              1,
              1
            ],
            [
              2,
              5,
              2
            ]
          ],
          "sourceMeasure": 39,
          "bows": [
            [
              0,
              0,
              "ㄇ"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 40
        },
        {
          "cells": [
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "4",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 41,
          "bows": [
            [
              0,
              0,
              "ㄇ"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "4",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 42,
          "fingerings": [
            [
              6,
              6,
              "0"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "1.",
              "units": 3
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              5
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              1,
              2
            ],
            [
              2,
              5,
              2
            ]
          ],
          "sourceMeasure": 43
        }
      ]
    },
    {
      "prefix": "",
      "measures": [
        {
          "cells": [
            {
              "label": "1",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "1",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "4",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 44
        },
        {
          "cells": [
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "1",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 4
            }
          ],
          "slurs": [
            [
              0,
              3
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ]
          ],
          "sourceMeasure": 45,
          "marker": "2 後倚音 5"
        },
        {
          "cells": [
            {
              "label": "3.",
              "units": 3
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "5",
              "units": 2
            },
            {
              "label": "6.",
              "units": 1.5
            },
            {
              "label": "2'",
              "units": 0.5
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              3,
              4
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              1,
              2
            ],
            [
              2,
              2,
              1
            ],
            [
              3,
              3,
              2
            ],
            [
              4,
              4,
              3
            ]
          ],
          "sourceMeasure": 46,
          "marker": "前倚音 5",
          "fingerings": [
            [
              1,
              1,
              "四"
            ],
            [
              2,
              2,
              "四"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "1'.",
              "units": 3
            },
            {
              "label": "2'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 2
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              4
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              1,
              2
            ],
            [
              2,
              3,
              2
            ],
            [
              4,
              4,
              1
            ]
          ],
          "sourceMeasure": 47,
          "marker": "第一結尾開始",
          "bows": [
            [
              0,
              0,
              "V"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "6.",
              "units": 3
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              5
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              1,
              2
            ],
            [
              2,
              5,
              2
            ]
          ],
          "sourceMeasure": 48,
          "bows": [
            [
              0,
              0,
              "ㄇ"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "1",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "1",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "4",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 49
        }
      ]
    },
    {
      "prefix": "",
      "measures": [
        {
          "cells": [
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "1",
              "units": 0.5
            },
            {
              "label": "2",
              "units": 0.5
            },
            {
              "label": "3",
              "units": 0.5
            },
            {
              "label": "5",
              "units": 0.5
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "1",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              5
            ],
            [
              6,
              9
            ]
          ],
          "underlines": [
            [
              0,
              1,
              2
            ],
            [
              2,
              5,
              3
            ],
            [
              6,
              9,
              2
            ]
          ],
          "sourceMeasure": 50
        },
        {
          "cells": [
            {
              "label": "3",
              "units": 2
            },
            {
              "label": "5",
              "units": 2
            },
            {
              "label": "5",
              "units": 2
            },
            {
              "label": "6.",
              "units": 1.5
            },
            {
              "label": "2'",
              "units": 0.5
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              3,
              4
            ]
          ],
          "underlines": [
            [
              0,
              1,
              1
            ],
            [
              2,
              2,
              1
            ],
            [
              3,
              3,
              2
            ],
            [
              4,
              4,
              3
            ]
          ],
          "sourceMeasure": 51,
          "bows": [
            [
              2,
              2,
              "V"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "1'.",
              "units": 3
            },
            {
              "label": "2'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 2
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              4
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              1,
              2
            ],
            [
              2,
              3,
              2
            ],
            [
              4,
              4,
              1
            ]
          ],
          "sourceMeasure": 52
        },
        {
          "cells": [
            {
              "label": "6",
              "units": 4
            },
            {
              "label": "-",
              "units": 4
            }
          ],
          "slurs": [],
          "underlines": [],
          "sourceMeasure": 53,
          "marker": "第一結尾止 𝄇"
        },
        {
          "cells": [
            {
              "label": "1'.",
              "units": 3
            },
            {
              "label": "2'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              3
            ],
            [
              4,
              5
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              1,
              2
            ],
            [
              2,
              5,
              2
            ]
          ],
          "sourceMeasure": 54,
          "marker": "第二結尾開始",
          "bows": [
            [
              0,
              0,
              "V"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "6.",
              "units": 3
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              5
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              1,
              2
            ],
            [
              2,
              5,
              2
            ]
          ],
          "sourceMeasure": 55,
          "bows": [
            [
              0,
              0,
              "ㄇ"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "1",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "1",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "4",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 56
        }
      ]
    },
    {
      "prefix": "",
      "measures": [
        {
          "cells": [
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "1",
              "units": 1
            },
            {
              "label": "2.",
              "units": 3
            },
            {
              "label": "3",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              5
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              4,
              1
            ],
            [
              5,
              5,
              2
            ]
          ],
          "sourceMeasure": 57
        },
        {
          "cells": [
            {
              "label": "3",
              "units": 2
            },
            {
              "label": "5",
              "units": 2
            },
            {
              "label": "5",
              "units": 2
            },
            {
              "label": "6.",
              "units": 1.5
            },
            {
              "label": "2'",
              "units": 0.5
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              3,
              4
            ]
          ],
          "underlines": [
            [
              0,
              1,
              1
            ],
            [
              2,
              2,
              1
            ],
            [
              3,
              3,
              2
            ],
            [
              4,
              4,
              3
            ]
          ],
          "sourceMeasure": 58,
          "marker": "前倚音 5",
          "bows": [
            [
              2,
              2,
              "V"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "1'.",
              "units": 3
            },
            {
              "label": "2'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 2
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              4
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              1,
              2
            ],
            [
              2,
              3,
              2
            ],
            [
              4,
              4,
              1
            ]
          ],
          "sourceMeasure": 59,
          "marker": "漸慢"
        },
        {
          "cells": [
            {
              "label": "6",
              "units": 4
            },
            {
              "label": "-",
              "units": 4
            }
          ],
          "slurs": [],
          "underlines": [],
          "sourceMeasure": 60,
          "marker": "第二結尾止 ‖"
        },
        {
          "cells": [
            {
              "label": "6",
              "units": 2
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "2'",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              2
            ],
            [
              3,
              6
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              2,
              2
            ],
            [
              3,
              6,
              2
            ]
          ],
          "sourceMeasure": 61,
          "marker": "【二】引子（",
          "bows": [
            [
              0,
              0,
              "ㄇ"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 62
        },
        {
          "cells": [
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "5",
              "units": 2
            },
            {
              "label": "6",
              "units": 4
            }
          ],
          "slurs": [
            [
              0,
              2
            ]
          ],
          "underlines": [
            [
              0,
              1,
              2
            ],
            [
              2,
              2,
              1
            ]
          ],
          "sourceMeasure": 63,
          "marker": "引子）",
          "bows": [
            [
              3,
              3,
              "V"
            ]
          ]
        }
      ]
    },
    {
      "prefix": "",
      "measures": [
        {
          "cells": [
            {
              "label": "6.",
              "units": 3
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "5",
              "units": 2
            },
            {
              "label": "3",
              "units": 2
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              3
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              1,
              2
            ],
            [
              2,
              3,
              1
            ]
          ],
          "sourceMeasure": 64,
          "marker": "𝄆 反覆開始",
          "bows": [
            [
              0,
              0,
              "ㄇ"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "4",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 65
        },
        {
          "cells": [
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 66
        },
        {
          "cells": [
            {
              "label": "1.",
              "units": 3
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              5
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              1,
              2
            ],
            [
              2,
              5,
              2
            ]
          ],
          "sourceMeasure": 67
        },
        {
          "cells": [
            {
              "label": "3",
              "units": 2
            },
            {
              "label": "1'",
              "units": 2
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              5
            ]
          ],
          "underlines": [
            [
              0,
              1,
              1
            ],
            [
              2,
              5,
              2
            ]
          ],
          "sourceMeasure": 68
        },
        {
          "cells": [
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 69
        }
      ]
    },
    {
      "prefix": "",
      "measures": [
        {
          "cells": [
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "5",
              "units": 2
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              6
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              5,
              2
            ],
            [
              6,
              6,
              1
            ]
          ],
          "sourceMeasure": 70
        },
        {
          "cells": [
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 71
        },
        {
          "cells": [
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "5",
              "units": 2
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              6
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              5,
              2
            ],
            [
              6,
              6,
              1
            ]
          ],
          "sourceMeasure": 72,
          "fingerings": [
            [
              3,
              3,
              "四"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 73
        },
        {
          "cells": [
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 4
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              3,
              4
            ]
          ],
          "underlines": [
            [
              0,
              1,
              2
            ],
            [
              3,
              4,
              2
            ]
          ],
          "sourceMeasure": 74
        },
        {
          "cells": [
            {
              "label": "5",
              "units": 2
            },
            {
              "label": "5",
              "units": 2
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              5
            ]
          ],
          "underlines": [
            [
              0,
              1,
              1
            ],
            [
              2,
              5,
              2
            ]
          ],
          "sourceMeasure": 75,
          "fingerings": [
            [
              1,
              1,
              "四"
            ]
          ]
        }
      ]
    },
    {
      "prefix": "",
      "measures": [
        {
          "cells": [
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 76
        },
        {
          "cells": [
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 77
        },
        {
          "cells": [
            {
              "label": "1.",
              "units": 3
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              5
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              1,
              2
            ],
            [
              2,
              5,
              2
            ]
          ],
          "sourceMeasure": 78
        },
        {
          "cells": [
            {
              "label": "1",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "1",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 79
        },
        {
          "cells": [
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "1",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "1",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 80
        },
        {
          "cells": [
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 81
        }
      ]
    },
    {
      "prefix": "",
      "measures": [
        {
          "cells": [
            {
              "label": "1'.",
              "units": 3
            },
            {
              "label": "2'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              5
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              1,
              2
            ],
            [
              2,
              5,
              2
            ]
          ],
          "sourceMeasure": 82,
          "fingerings": [
            [
              0,
              0,
              "四"
            ]
          ]
        },
        {
          "cells": [
            {
              "label": "6.",
              "units": 3
            },
            {
              "label": "1'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              5
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              1,
              2
            ],
            [
              2,
              5,
              2
            ]
          ],
          "sourceMeasure": 83
        },
        {
          "cells": [
            {
              "label": "1",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "1",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 84
        },
        {
          "cells": [
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "1",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "1",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 85
        },
        {
          "cells": [
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            },
            {
              "label": "2",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              3
            ],
            [
              4,
              7
            ]
          ],
          "underlines": [
            [
              0,
              3,
              2
            ],
            [
              4,
              7,
              2
            ]
          ],
          "sourceMeasure": 86
        },
        {
          "cells": [
            {
              "label": "1'.",
              "units": 3
            },
            {
              "label": "2'",
              "units": 1
            },
            {
              "label": "7",
              "units": 1
            },
            {
              "label": "6",
              "units": 1
            },
            {
              "label": "5",
              "units": 1
            },
            {
              "label": "3",
              "units": 1
            }
          ],
          "slurs": [
            [
              0,
              1
            ],
            [
              2,
              5
            ]
          ],
          "underlines": [
            [
              0,
              0,
              1
            ],
            [
              1,
              1,
              2
            ],
            [
              2,
              5,
              2
            ]
          ],
          "sourceMeasure": 87
        },
        {
          "cells": [
            {
              "label": "6",
              "units": 4
            },
            {
              "label": "-",
              "units": 4
            }
          ],
          "slurs": [],
          "underlines": [],
          "sourceMeasure": 88,
          "marker": "𝄇 終止"
        }
      ]
    }
  ],
  "sourceImage": "./assets/scores/zizhu-source.png",
  "notation": "6 5 6 1' 2' 1' 7 | 6 7 6 5 3 2 3 5 | 6 0 6 0 | 6 5 6 1' 5 6 5 3 | 6 5 6 1' 5 6 5 3 | 2. 3 5 1' 6 5 3 2\n1. 2 1' 7 6 5 | 3 1' 6 5 | 3. 5 6 5 6 1' | 5 5 6 1 2 | 3. 5 6 5 6 1' | 5. 1 | 1' 6 5 3. 5 6 1' | 5. 6 1'\n5 6 5 1' 7 | 6 1' 6 5 3 | 5 2 3 3 2 | 1. 3 2 | 1. 2 5 5 3 | 2 3 2 1 2 | 3 5 6 | 1'. 2' 7 6 5\n6 - | 1. 2 5 5 3 | 2 3 2 1 2 | 3 5 6 | 1'. 2' 7 6 5 | 6 - | 6 5 6 1' 5 6 5 3 | 6 5 6 1' 5 6 4 3\n2. 3 4 7 6 5 3 2 | 1 5. 6 | 3 1' 1' 7 6 5 | 3. 5 6 5 6 1' | 5 1 5 7 6 1' | 3. 5 6 5 6 1' | 5 1 5 7 6 5\n1' 7 6 1' 3 5 6 1' | 5 1 5 6 1' 7 | 5 6 5 6 5 6 1' 7 | 6 7 6 5 4 3 2 6 | 5 6 2 4 3 2 5 6 | 1. 2 1' 7 6 1'\n1 2 1 6 5 6 4 3 | 2 3 1 3 2 | 3. 5 5 6. 2' | 1'. 2' 7 6 5 | 6. 1' 7 6 5 6 | 1 2 1 6 5 6 4 3\n2 3 1 2 3 5 2 3 1 2 | 3 5 5 6. 2' | 1'. 2' 7 6 5 | 6 - | 1'. 2' 7 6 5 7 | 6. 1' 7 6 5 6 | 1 2 1 6 5 6 4 3\n2 3 2 1 2. 3 | 3 5 5 6. 2' | 1'. 2' 7 6 5 | 6 - | 6 5 6 1' 2' 1' 7 | 6 7 6 5 3 2 3 5 | 6 3 5 6\n6. 1' 5 3 | 6 5 6 1' 5 6 4 3 | 2 3 5 7 6 5 3 2 | 1. 2 1' 7 6 5 | 3 1' 1' 7 6 5 | 3 2 3 5 6 5 6 1'\n5 6 5 3 2 3 5 | 3 2 3 5 6 5 6 1' | 5 6 5 3 2 3 5 | 1' 7 6 5 3 5 6 1' | 5 6 5 6 1' | 5 5 5 6 1' 7\n6 7 6 5 3 5 2 3 | 5 6 5 2 3 2 5 6 | 1. 2 1' 7 6 5 | 1 2 1 2 5 6 5 3 | 2 3 2 1 2 3 1 2 | 3 2 5 7 6 5 3 2\n1'. 2' 7 6 5 3 | 6. 1' 7 6 5 3 | 1 2 1 2 5 6 5 3 | 2 3 1 3 2 3 1 2 | 3 2 5 7 6 5 3 2 | 1'. 2' 7 6 5 3 | 6 -"
});

  window.ErhuPieceScores = {
    pieces: pieces,
    register: register,
    getScore: getScore,
    getBaseScore: getBaseScore,
    getEditableScore: getEditableScore,
    saveOverride: saveOverride,
    clearOverride: clearOverride,
    hasOverride: hasOverride,
    readDraft: readDraft,
    saveDraft: saveDraft,
    clearDraft: clearDraft,
    listPieces: listPieces,
    normalizeTitle: normalizeTitle,
    helpers: {
      n: n,
      q: q,
      e: e,
      s: s,
      h: h,
      w: w,
      measure: measure,
      span: span,
      underline: underline,
      guide: guide,
      bow: bow,
      fingering: fingering,
      upperNote: upperNote
    }
  };
}());
