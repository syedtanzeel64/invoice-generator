# Tanzeels Invoice Generator

A professional, full-stack invoice management system designed for ease of use and high-fidelity PDF exports.

## 🚀 Features

- **Dynamic Invoice Creation**: Real-time preview of your invoice as you type.
- **Premium PDF Export**: High-quality PDF generation using `html2canvas` and `jsPDF` with specialized `onclone` scaling for perfect text rendering.
- **Payment Tracking**: Track "Amount Paid" and "Balance Due" with automatic status highlighting (Green for settled, Red for outstanding).
- **User Authentication**: Secure Login/Register system using JWT and password hashing.
- **Invoice History**: Save, view, and delete previous invoices.
- **Custom Branding**: Upload your business logo (stored as Base64) and personalize business details.
- **Indian Rupee (₹) Support**: Automatic Indian number formatting (en-IN).

## 🛠️ Tech Stack

### Frontend
- **React.js (Vite)**: Core framework for a fast, reactive UI.
- **Tailwind CSS**: Modern styling for the application interface.
- **Inline CSS**: Robust styling within the `InvoicePreview` component to ensure 100% layout fidelity during PDF capture.
- **html2canvas**: Captures the DOM as a canvas element.
- **jsPDF**: Generates the final PDF document from the captured canvas.
- **Lucide React**: Clean, modern iconography.

### Backend
- **Node.js & Express**: Scalable backend server architecture.
- **SQLite3**: Lightweight, file-based database for local data persistence.
- **JSON Web Tokens (JWT)**: Secure, stateless authentication.
- **Bcrypt.js**: Industry-standard password encryption.

## 📦 Installation & Setup

### 1. Clone the Repository
```bash
# This is a local project. Copy the folder to your desired location.
cd invoice-generator
```

### 2. Backend Setup
```bash
cd backend
npm install
node server.js
```
*The server runs on `http://localhost:5000`*

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
*The app runs on `http://localhost:5173`*

## 📝 GitHub Upload Instructions

To upload this project to your own GitHub account, follow these steps:

1. **Create a new repository** on [GitHub](https://github.com/new).
2. **Open your terminal** in the project root folder.
3. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Tanzeels Invoice Generator"
   ```
4. **Link to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

---
**Developed and Designed by Syed Tanzeel Maqsood**
