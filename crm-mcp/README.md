# CRM-RG — מערכת MCP + Flutter

```
┌──────────────┐   REST /api    ┌───────────────────────────┐
│ Flutter app  │ ─────────────▶ │  server/ (Node + TS)      │
└──────────────┘                │   CrmService (לוגיקה)     │──▶ SQLite
┌──────────────┐   MCP /mcp     │   ├─ REST router          │
│ Claude / AI  │ ─────────────▶ │   └─ MCP server (tools)   │
└──────────────┘   או stdio     └───────────────────────────┘
```

שכבת לוגיקה אחת (`CrmService`) משרתת גם את האפליקציה וגם את ה-AI, כך שכל פעולה
שה-AI עושה מופיעה מיד באפליקציה (עם `actor: "ai"` בהיסטוריית הפעילות).

## שלבים
- [x] **שלב 1** — שרת: מסד נתונים, REST API, שרת MCP, בדיקות
- [ ] **שלב 2** — אפליקציית Flutter: רשימת לידים, פרטי ליד, משימות
- [ ] **שלב 3** — צ'אט AI בתוך האפליקציה שמשתמש בכלי ה-MCP
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

משתני סביבה: `PORT`, `DB_PATH` (ברירת מחדל `./data/crm.db`), `API_TOKEN` (אם מוגדר — חובה `Authorization: Bearer`).

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
