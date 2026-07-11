# GrowEasy CRM

GrowEasy CRM is a modern, lightweight customer relationship management (CRM) dashboard built with Next.js, Tailwind CSS, and the Google Gemini API. It features an intelligent **AI-Powered CSV Importer** that can automatically map, clean, and extract leads from unstructured CSV files, making lead management seamless and effortless.

## ✨ Features

- **Modern Dashboard**: A clean, responsive, and beautiful UI for managing leads, built with React and Tailwind CSS.
- **AI-Powered CSV Import**: Upload raw CSV files of leads. The system uses Gemini (Generative AI) to intelligently map columns (even if they don't exactly match your CRM headers), clean up data, and validate required fields.
- **Graceful Error Handling**: Automatically handles rate limits and API crashes. If the import hits a snag halfway through, it saves the successfully processed leads so no progress is lost.
- **Mock Fallback**: If the Gemini API key is missing or quota is exceeded, the app gracefully falls back to a heuristic-based mock extraction so you are never blocked.
- **Real-time Statistics**: Dashboard stats automatically update to reflect your newly imported data and skipped records.
- **Docker Support**: Containerized for easy deployment and development using Docker and Docker Compose.
- **Unit Testing**: Pre-configured with Vitest for robust component and utility testing.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **CSV Parsing**: [PapaParse](https://www.papaparse.com/)
- **AI Integration**: [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) (Gemini 2.0 Flash)
- **Testing**: [Vitest](https://vitest.dev/)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm, yarn, pnpm, or bun
- (Optional) [Docker](https://www.docker.com/) and Docker Compose for containerized setup

### Local Setup

1. **Clone the repository** (if applicable) and navigate to the project directory:
   ```bash
   cd grow
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env` file in the root directory and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *(Note: If you don't provide an API key, the app will still work using the built-in mock heuristic mapper).*

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open the app**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Setup

If you prefer using Docker, you can quickly spin up the application using Docker Compose:

1. Create your `.env` file with `GEMINI_API_KEY`.
2. Run the following command:
   ```bash
   docker-compose up -d --build
   ```
3. The app will be available at [http://localhost:3000](http://localhost:3000).

To stop the container:
```bash
docker-compose down
```

## 🧪 Testing

This project uses [Vitest](https://vitest.dev/) for testing.

To run the test suite:
```bash
npm run test
```

## 📖 Usage

1. Click on **"Import CSV"** in the top right corner of the dashboard.
2. Drag and drop your CSV file or select one from your computer.
3. Review the preview and adjust any column mappings if necessary.
4. Click **"Confirm Import"** to let the AI process your leads.
5. Review the summary of successfully imported vs. skipped leads, then click **"Done"** to see them on your dashboard!

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
