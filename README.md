# 🔒 ZK Invoice Factoring

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Deploy on Netlify](https://img.shields.io/badge/Frontend-Netlify-blue?logo=netlify)](https://www.netlify.com/)
[![Deploy on Heroku](https://img.shields.io/badge/Backend-Heroku-430098?logo=heroku)](https://heroku.com/)

> **Zero-Knowledge Proofs for Invoice Payment Reliability**
>
> **ZK Invoice Factoring** lets lenders instantly and privately verify a business’s historical payment reliability, using zero-knowledge cryptography and real accounting data. No sensitive details revealed.

---

## 🚀 Features

- **Privacy-preserving ZK Proofs:** Prove your invoice payment reliability without revealing confidential business data
- **One-click QuickBooks Integration:** OAuth2 workflow securely fetches invoice stats, minimizing manual input
- **Production-Ready UI:** Modern React frontend, ready to embed as a widget or iframe in loan provider websites
- **Bank & Lender Friendly:** White-label and SaaS deploy options
- **Noir ZK Circuits:** Battle-tested zero-knowledge proofs, high performance, low overhead
- **Simple API:** Integrate with existing fintech platforms in minutes

---

## 🧑‍💻 Demo

**Try it live:**  
[https://zkinvoicefactoring.netlify.app/](#) <!-- _Add your live Netlify link here when ready!_ -->

---

## 🏗️ Architecture

React Frontend (Netlify)
|
| HTTPS POST
v
Express Backend (Heroku)
|
| Noir CLI (nargo)
v
Noir ZK Circuit: invoice_reliability



- **Frontend:** React (Create React App), ready for embed/iframe
- **Backend:** Express/TypeScript/Node, API endpoints for ZK proof and QuickBooks
- **Proof engine:** Noir (Aztec Labs) for high-performance zkSNARKs

---

## 💡 Why Zero-Knowledge? (Business Pitch)

> **Lenders need trust. Borrowers need privacy.**
>
> ZK Invoice Factoring lets businesses **prove they meet reliability criteria** (e.g., “95% of invoices paid on time”) to any loan provider, without sharing:
> - Exact client list
> - Revenue or deal size
> - Any other confidential details
>
> **It’s win-win:**  
> Lenders get trusted, tamper-proof data.  
> Borrowers keep full privacy and control.

---
📝 Invoice Reliability Scorecard: Manual vs. Automated Modes
ZK Invoice Factoring supports both:

QuickBooks-connected (Automated) Mode:
All six lender checks are performed using live data from QuickBooks.

Manual Entry Mode:
Only the two most critical checks are run (Invoice Reliability and Debt-to-Income Ratio) for fast, privacy-friendly scoring.

How It Works
If you connect QuickBooks:
The backend runs all 6 criteria:

Invoice Reliability (paid % threshold)

Debt-to-Income Ratio

Days Sales Outstanding (DSO)

Accounts Receivable Aging

Annual Revenue

Customer Concentration

If you enter numbers manually:
Only Invoice Reliability and DTI Ratio are checked for a simple, rapid screen—no extra business details required.

This ensures:

Businesses can prove reliability instantly, even without sharing all financials

Lenders get a fast risk screen, with the option to require more detailed proof (via QuickBooks integration) if needed

⚙️ Manual/Automated Mode Detection
The backend automatically detects manual mode when you submit only the core required fields, or you can send a "manual": true flag for clarity.

This lets you embed or integrate ZK Invoice Factoring in any context—full API, SaaS dashboard, or widget.

Example API Payloads
Manual Mode:


{
  "total_invoices": 12,
  "paid_invoices": 11,
  "threshold_percent": 90,
  "total_debt": 3000,
  "total_income": 10000,
  "dti_threshold_bp": 4000,
  "manual": true
}
QuickBooks (Full) Mode:

{
  "total_invoices": 85,
  "paid_invoices": 77,
  "threshold_percent": 90,
  "total_debt": 9000,
  "total_income": 31000,
  "dti_threshold_bp": 4000,
  "dso": 39,
  "dso_threshold": 45,
  "ar_over60": 1100,
  "ar_total": 7400,
  "ar_pct_threshold_bp": 1000,
  "revenue12mo": 142000,
  "revenue_threshold": 120000,
  "largest_cust_sales": 35000,
  "total_sales": 84000,
  "concentration_threshold_bp": 5000
}
🟢 “Passes All Lender Criteria” Logic
Manual: Both reliability and DTI must pass (✅).

QuickBooks: All six criteria must pass (✅).

UI and API responses will always show only the relevant checks for the current mode.

🎯 Target Audience & Use Cases
ZK Invoice Factoring is designed for:

Lenders & Loan Officers:
Instantly screen business borrowers for invoice payment reliability, fraud-resistance, and overall financial health—directly in your own portal or workflow.
Plug in as a widget, iframe, or API to any lending app.

Business Owners (Borrowers):
Prove your reliability to lenders, banks, or factoring companies, without exposing private business data.

Business Buyers, Sellers & M&A Advisors:
Use ZK Invoice Factoring as a business evaluation tool during acquisition or sale.
Privately verify that a business’s financial track record and customer reliability meets your risk or acquisition criteria.

Accounting and Fintech SaaS:
Integrate with your platform or offer to your clients as a “privacy-first due diligence” add-on.

🛒 QuickBooks Store App: Coming Soon
ZK Invoice Factoring will be available in the official QuickBooks App Store, making it effortless for millions of businesses to connect and generate ZK reliability proofs using their actual QuickBooks data, in one click.

Built for QuickBooks Online:
Deep OAuth2 integration, security best practices, and user experience tailored for QuickBooks users

Easy to Use:
Connect your business in seconds, and share a zero-knowledge reliability report with lenders, partners, or buyers.

🌍 Where Can It Be Used?
Lender/Banker websites

M&A/broker evaluation dashboards

Accounting platforms and business management tools

Embedded in B2B SaaS as a widget or iframe

Direct-to-business QuickBooks app

🔗 Ready for the Future
White-label options for banks, SaaS providers, and lenders

API-first design: simple, embeddable, and easy to automate

🚀 Try it now
See the Netlify Frontend Demo https://zkinvoicefactoring.netlify.app/

Connect your own QuickBooks or enter numbers manually

Instantly generate a privacy-preserving reliability proof