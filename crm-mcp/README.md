# CRM-RG — מערכת MCP + Flutter

```
┌──────────────┐   REST /api    ┌───────────────────────────┐
│ Flutter app  │ ─────────────▶ │  server/ (Node + TS)      │
│  + צ'אט AI   │  /api/chat ──▶ │   ChatService ─▶ Claude   │
└──────────────┘                │   CrmService (לוגיקה)     │──▶ SQLite
┌──────────────┐   MCP /mcp     │   ├─ REST router          │
│ Claude / AI  │ ─────────────▶ │   └─ MCP server (tools)   │
└──────────────┘   או stdio     └───────────────────────────┘
```

שכבת לוגיקה אחת (`CrmService`) משרתת גם את האפליקציה וגם את ה-AI, כך שכל פעולה
שה-AI עושה מופיעה מיד באפליקציה (עם `actor: "ai"` בהיסטוריית הפעילות).

## שלבים
- [x] **שלב 1** — שרת: מסד נתונים, REST API, שרת MCP, בדיקות
- [x] **שלב 2** — אפליקציית Flutter: דשבורד, לידים, פרטי ליד, משימות (עברית RTL)
- [x] **שלב 3** — צ'אט AI בתוך האפליקציה שמשתמש בכלי ה-MCP
- [ ] **שלב 4** — התחברות משתמשים ופריסה לענן

## הרצת השרת
דרוש Node 22.13 ומעלה (משתמש ב-`node:sqlite` המובנה, בלי תלויות נייטיב).

```bash
cd crm-mcp/server
npm install
npm run seed      # נתוני דוגמה
npm run dev       # http://localhost:3000
npm test
```

משתני סביבה: `PORT`, `DB_PATH` (ברירת מחדל `./data/crm.db`), `API_TOKEN` (אם מוגדר — חובה `Authorization: Bearer`),
`ANTHROPIC_API_KEY` (נדרש לעוזר ה-AI; בלעדיו `/api/chat` מחזיר 503 וכל השאר עובד).

## עוזר ה-AI (שלב 3)
`POST /api/chat` מקבל את השיחה (`{"messages":[{"role":"user","content":"..."}]}`) ומחזיר
`{reply, actions, changed_data}`.

איך זה עובד: השרת מחבר בתוך התהליך לקוח MCP לשרת ה-MCP של ה-CRM, ממיר את הכלים שלו
לכלים של Claude (`mcpTools` מה-SDK של Anthropic) ומריץ את הלולאה עם ה-Tool Runner
(מודל `claude-opus-5-5`, effort `medium`, ועם fallback אוטומטי אם הבקשה נדחית).
כך הצ'אט משתמש בדיוק באותם כלים כמו Claude Desktop, וכל שינוי נרשם כפעולת AI.
המפתח נשאר בשרת בלבד ולא נשמר באפליקציה.

```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm run dev
```

## הרצת האפליקציה (Flutter)
דרוש Flutter 3.50 ומעלה. השרת צריך לרוץ קודם.

```bash
cd crm-mcp/app
flutter pub get
flutter run -d chrome                                            # ווב
flutter run --dart-define=API_URL=http://10.0.2.2:3000           # אמולטור אנדרואיד
flutter run --dart-define=API_URL=http://192.168.1.10:3000       # מכשיר אמיתי (IP של המחשב)
flutter test
```

אם הוגדר `API_TOKEN` בשרת, מוסיפים `--dart-define=API_TOKEN=...`.
לבניית ווב לפרודקשן: `flutter build web --no-web-resources-cdn --dart-define=API_URL=https://...`

מבנה האפליקציה:
- `lib/api/crm_api.dart` — לקוח REST
- `lib/models/models.dart` — מודלים + תרגום שלבים/פעילויות לעברית
- `lib/providers.dart` — מצב האפליקציה (Riverpod)
- `lib/screens/` — דשבורד, לידים, פרטי ליד, טופס ליד, משימות

פעולות שה-AI ביצע דרך MCP מסומנות ב-✨ בהיסטוריית הליד.

## כלי MCP
| כלי | תיאור |
|---|---|
| `search_leads` | חיפוש לידים לפי שלב / טקסט |
| `get_lead` | ליד + משימות + היסטוריה |
| `create_lead` / `update_lead` | יצירה ועדכון ליד |
| `add_note` | הוספת הערה להיסטוריה |
| `list_tasks` / `create_task` / `complete_task` | ניהול משימות |
| `pipeline_summary` | סיכום הפייפליין |

בנוסף: resource `crm://pipeline/summary` ו-prompt `daily_briefing`.

## חיבור ל-Claude
**Claude Code (HTTP):**
```bash
claude mcp add --transport http crm http://localhost:3000/mcp
```
**Claude Desktop (stdio)** — ב-`claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "crm": {
      "command": "npx",
      "args": ["tsx", "/path/to/crm-mcp/server/src/stdio.ts"],
      "env": { "DB_PATH": "/path/to/crm-mcp/server/data/crm.db" }
    }
  }
}
```
