# Food Compliance Tracker

A GitHub Pages website that tracks country compliance requirements for seasoning and snack products.

## What it tracks

- Additive limits
- Microbiology limits
- Contaminant limits
- Salt / sodium limits
- Allergen list / labeling requirements

## Important limitation

This is an AI-assisted monitoring system. It is useful for screening and change tracking, but it is not legal approval. Always verify against the official regulation before product release, export, label approval, customer declaration or audit response.

## Setup

1. Create a new GitHub repository.
2. Upload all files in this folder.
3. Go to **Settings > Secrets and variables > Actions > New repository secret**.
4. Add:
   - Name: `GEMINI_API_KEY`
   - Value: your Gemini API key
5. Go to **Settings > Pages**.
6. Set source to **Deploy from branch**.
7. Select branch `main` and folder `/root`.
8. Open the GitHub Pages URL.

## Daily update

The workflow `.github/workflows/update-compliance.yml` runs every day at 02:00 Singapore time. It fetches the official source pages listed in `data/sources.json`, asks Gemini 2.5 Flash to extract structured compliance rules, then updates `data/compliance.json`.

You can also run it manually from **Actions > Daily compliance update > Run workflow**.

## Add more countries

Edit `data/sources.json` and add another object:

```json
{
  "country": "Thailand",
  "authority": "Authority name",
  "urls": ["https://official-source-url"],
  "foodCategories": ["seasoning", "snacks"]
}
```

Use official government or authority links wherever possible.

## Local test

```bash
npm run serve
```

Then open `http://localhost:8080`.

To test the updater locally:

```bash
export GEMINI_API_KEY="your-key"
npm run update
```
