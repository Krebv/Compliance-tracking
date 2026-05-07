# Food Regulatory Intelligence Tracker

This is an upgraded GitHub Pages compliance tracker for seasoning and snack products.

## What changed from the starter version

- `data/compliance.json` stores current extracted regulatory rules.
- `data/changes.json` stores added / modified / removed rules versus the previous run.
- `data/alerts.json` stores practical QA/regulatory alerts.
- `data/history/` stores dated snapshots for audit trail.
- GitHub Actions runs daily at 02:00 Singapore time.
- Gemini 2.5 Flash is used only inside GitHub Actions. Your API key is not exposed to website users.

## Files you normally edit

### Add or modify countries
Edit:

```text
data/sources.json
```

Each country must use this format:

```json
{
  "country": "Thailand",
  "authority": "Thai FDA / Ministry of Public Health",
  "urls": ["https://food.fda.moph.go.th/"],
  "foodCategories": ["seasoning", "snack food"]
}
```

### Update the AI extraction logic
Edit:

```text
scripts/update-compliance.mjs
```

### Update the website display
Edit:

```text
index.html
styles.css
app.js
```

## GitHub setup

1. Upload files to your GitHub repository root.
2. Go to `Settings > Secrets and variables > Actions`.
3. Add repository secret:

```text
GEMINI_API_KEY
```

4. Go to `Settings > Pages`.
5. Select `Deploy from branch`.
6. Select `main` and `/ (root)`.
7. Run `Actions > Daily Compliance Update > Run workflow`.

## Important caution

This is an AI-assisted monitoring and screening system. It is not legal approval. For product release, export approval, label declaration or customer compliance confirmation, verify the original official regulation and keep human QA/regulatory approval.
