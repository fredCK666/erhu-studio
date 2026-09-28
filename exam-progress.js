(function () {
  function toPositiveNumber(rawValue, fallbackValue) {
    var value = Number(rawValue);
    if (!isFinite(value) || value < 1) {
      return fallbackValue;
    }
    return Math.max(1, Math.round(value));
  }

  function getGradeNumber(params, fallbackValue) {
    var rawValue = params.get("grade");
    if (rawValue == null || rawValue === "") {
      rawValue = params.get("week");
    }
    return toPositiveNumber(rawValue, fallbackValue || 1);
  }

  function setGradeParam(searchParams, gradeNumber) {
    searchParams.set("grade", String(gradeNumber));
    searchParams.delete("week");
    return searchParams;
  }

  function buildUrl(path, fields) {
    var searchParams = new URLSearchParams();
    Object.keys(fields || {}).forEach(function (key) {
      var value = fields[key];
      if (value == null || value === "") {
        return;
      }
      searchParams.set(key, String(value));
    });
    if (searchParams.has("week") && !searchParams.has("grade")) {
      searchParams.set("grade", searchParams.get("week"));
    }
    searchParams.delete("week");
    var queryString = searchParams.toString();
    return queryString ? (path + "?" + queryString) : path;
  }

  function gradeField(index) {
    return "grade_" + index;
  }

  function legacyGradeField(index) {
    return "week_" + index;
  }

  function isCompleted(data, index) {
    if (!data) {
      return false;
    }
    return Boolean(data[gradeField(index)] || data[legacyGradeField(index)]);
  }

  function countCompleted(data, total) {
    var completed = 0;
    for (var index = 1; index <= total; index += 1) {
      if (isCompleted(data, index)) {
        completed += 1;
      }
    }
    return completed;
  }

  function buildTrackerPayload(total, resolver) {
    var state = {};
    for (var index = 1; index <= total; index += 1) {
      var checked = Boolean(typeof resolver === "function" ? resolver(index) : resolver[index - 1]);
      state[gradeField(index)] = checked;
      state[legacyGradeField(index)] = checked;
    }
    return state;
  }

  function scoreDocIds(levelKey, gradeNumber) {
    return {
      primary: levelKey + "_grade_" + gradeNumber,
      legacy: levelKey + "_week_" + gradeNumber
    };
  }

  function parseScoreDocId(id) {
    var match = String(id || "").match(/^(beginner|intermediate|advanced)_(grade|week)_(\d+)$/);
    if (!match) {
      return null;
    }
    return {
      level: match[1],
      variant: match[2],
      grade: Number(match[3])
    };
  }

  function recordGrade(record, fallbackValue) {
    return toPositiveNumber(record && (record.grade || record.week), fallbackValue || 1);
  }

  window.ErhuExamProgress = {
    getGradeNumber: getGradeNumber,
    setGradeParam: setGradeParam,
    buildUrl: buildUrl,
    gradeField: gradeField,
    legacyGradeField: legacyGradeField,
    isCompleted: isCompleted,
    countCompleted: countCompleted,
    buildTrackerPayload: buildTrackerPayload,
    scoreDocIds: scoreDocIds,
    parseScoreDocId: parseScoreDocId,
    recordGrade: recordGrade
  };
}());
