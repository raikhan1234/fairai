# FairAI — Web-Based Decision Support Tool for AI Fairness Evaluation

A full-stack web platform for evaluating fairness and transparency in Machine Learning models.  
Built as a Bachelor's thesis project at **Astana IT University, 2026**.

## Live Demo
> Link will appear here after deployment

## What it does

Upload a tabular dataset, train a classifier, and instantly see:
- **Accuracy metrics** — precision, recall, F1-score
- **Fairness metrics** — Demographic Parity Difference (DPD), Equal Opportunity Difference (EOD), Equalized Odds Difference (EqOD)
- **Group-level analysis** — bias breakdown by gender, race, or any protected attribute
- **Bias mitigation** — reweighting and threshold optimization

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| Backend | FastAPI, Python 3.11, Uvicorn |
| ML | scikit-learn, XGBoost, pandas, numpy |
| Dataset | ACSIncome (195,665 records, California 2018) |

## Run Locally

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Author

**Berkenova Raikhan** — IT-2301, Astana IT University  
Supervisor: Daniyar Rakhimzhanov
