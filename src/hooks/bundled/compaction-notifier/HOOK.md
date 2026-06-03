---
name: compaction-notifier
description: "Send visible chat notices when session compaction starts and finishes."
metadata:
  {
    "sunclaw":
      {
        "emoji": "🧹",
        "events": ["session:compact:before", "session:compact:after"],
        "always": true,
      },
  }
---

# Compaction Notifier

Sends short user-visible status messages when SunClaw compacts a session transcript. Enable with:

```bash
sunclaw hooks enable compaction-notifier
```

This is useful on chat surfaces where a long turn can otherwise look stalled while context is being summarized.
