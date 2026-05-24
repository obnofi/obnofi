// 페이지 Glyph(아이콘) 섹션 데이터 및 관련 상수

export const RECENT_PAGE_GLYPHS_STORAGE_KEY = "obnofi-recent-page-glyphs";
export const MAX_RECENT_PAGE_GLYPHS = 18;

export const pageGlyphSections = [
  {
    id: "recently-picked",
    label: "추천",
    glyphs: [
      { emoji: "🌱", keywords: ["seed", "new", "start", "plant"] },
      { emoji: "📝", keywords: ["note", "doc", "write", "text"] },
      { emoji: "📚", keywords: ["book", "wiki", "knowledge"] },
      { emoji: "📌", keywords: ["pin", "important", "highlight"] },
      { emoji: "💡", keywords: ["idea", "brainstorm", "insight"] },
      { emoji: "🚀", keywords: ["launch", "project", "ship"] },
      { emoji: "🎯", keywords: ["goal", "focus", "target"] },
      { emoji: "✅", keywords: ["done", "task", "check"] },
      { emoji: "🧠", keywords: ["brain", "thinking", "research"] },
      { emoji: "🧭", keywords: ["plan", "guide", "direction"] },
      { emoji: "🛠️", keywords: ["tool", "build", "fix"] },
      { emoji: "🔗", keywords: ["link", "relation", "reference"] },
    ],
  },
  {
    id: "nature",
    label: "Jungle",
    glyphs: [
      { emoji: "🌿", keywords: ["leaf", "nature", "green"] },
      { emoji: "🍃", keywords: ["wind", "leaf", "fresh"] },
      { emoji: "🌳", keywords: ["tree", "grove", "forest"] },
      { emoji: "🪴", keywords: ["plant", "pot", "garden"] },
      { emoji: "🌲", keywords: ["pine", "tree", "forest"] },
      { emoji: "🌊", keywords: ["wave", "water", "ocean"] },
      { emoji: "☁️", keywords: ["cloud", "sky", "weather"] },
      { emoji: "🌞", keywords: ["sun", "day", "bright"] },
      { emoji: "🌙", keywords: ["moon", "night", "dark"] },
      { emoji: "⭐", keywords: ["star", "favorite", "important"] },
      { emoji: "🔥", keywords: ["fire", "hot", "streak"] },
      { emoji: "✨", keywords: ["sparkle", "magic", "highlight"] },
    ],
  },
  {
    id: "work",
    label: "Work",
    glyphs: [
      { emoji: "📅", keywords: ["calendar", "schedule", "date"] },
      { emoji: "📈", keywords: ["chart", "growth", "metrics"] },
      { emoji: "🗂️", keywords: ["folder", "organize", "database"] },
      { emoji: "📊", keywords: ["graph", "report", "analytics"] },
      { emoji: "📋", keywords: ["list", "brief", "notes"] },
      { emoji: "📎", keywords: ["attachment", "file", "clip"] },
      { emoji: "🧾", keywords: ["document", "receipt", "record"] },
      { emoji: "💼", keywords: ["business", "company", "work"] },
      { emoji: "🗓️", keywords: ["plan", "agenda", "schedule"] },
      { emoji: "📍", keywords: ["location", "focus", "pin"] },
      { emoji: "🔒", keywords: ["private", "secure", "lock"] },
      { emoji: "🎨", keywords: ["design", "creative", "art"] },
    ],
  },
  {
    id: "personal",
    label: "Personal",
    glyphs: [
      { emoji: "🏠", keywords: ["home", "personal", "life"] },
      { emoji: "❤️", keywords: ["love", "favorite", "heart"] },
      { emoji: "☕", keywords: ["coffee", "routine", "break"] },
      { emoji: "🎵", keywords: ["music", "audio", "playlist"] },
      { emoji: "📷", keywords: ["photo", "camera", "memory"] },
      { emoji: "🍽️", keywords: ["food", "meal", "recipe"] },
      { emoji: "✈️", keywords: ["travel", "trip", "flight"] },
      { emoji: "🏃", keywords: ["health", "exercise", "run"] },
      { emoji: "🎬", keywords: ["movie", "video", "watch"] },
      { emoji: "🎮", keywords: ["game", "play", "fun"] },
      { emoji: "🛌", keywords: ["rest", "sleep", "recovery"] },
      { emoji: "🧘", keywords: ["calm", "meditation", "mind"] },
    ],
  },
] as const;
