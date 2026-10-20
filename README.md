# BrightWash Pro — Instant Pressure Washing Estimate

A mobile-friendly website where customers get an instant price estimate for pressure washing and send their request by email.

## Features
- **Services and pricing:** House $0.15/sq ft, Driveway $0.12/sq ft, Deck $0.30/sq ft, Fence $1.00/linear ft. The minimum job price is **$150**.
- For houses, driveways, and decks, customers enter length × width and the site calculates the area automatically. For fences, they enter total linear feet.
- The price updates live as the customer changes the service or the measurements.
- Validation: name, email, and phone (10-digit US) are required. Measurements must be greater than 0 and no more than 10,000 ft, and the minus sign is blocked.
- Submissions are emailed to **careers@finchharbor.com** through [EmailJS](https://www.emailjs.com).
- The success message appears **only after EmailJS confirms the email was sent**. If sending fails or email isn't configured, the customer sees a helpful error message instead.
- Simple spam protection (a hidden "honeypot" field).

## Files
| File | Purpose |
|---|---|
| `index.html` | Page structure and form |
| `styles.css` | Design and mobile layout |
| `script.js` | Price calculation, validation, and email sending |
| `config.js` | EmailJS IDs (public by design, not passwords) |

## Technology
Plain HTML, CSS, and JavaScript, with no build step and no server. Hosted on GitHub Pages.

## Email setup (EmailJS)
1. Create a free EmailJS account and add an **Email Service** (for example, Gmail).
2. Create an **Email Template**:
   - **To Email:** `careers@finchharbor.com`
   - **Reply To:** `{{customer_email}}`
   - **Subject:** `New estimate request: {{service}} – {{estimate}}`
   - **Content:**
     ```
     New pressure washing estimate request

     Name: {{customer_name}}
     Email: {{customer_email}}
     Phone: {{customer_phone}}
     Service: {{service}}
     Measurements: {{measurements}}
     Rate: {{rate}}
     Estimate: {{estimate}}
     Minimum applied: {{minimum_applied}}
     Submitted: {{submitted_at}}
     ```
3. Put the Public Key, Service ID, and Template ID into `config.js`.

**Security:** The recipient address is fixed inside the EmailJS template, so visitors can't redirect emails elsewhere. No private keys or passwords are stored in this code. EmailJS's Public Key is meant to appear in website code.
