# DocuConvert AI - Technical Specification & Overview

## App Overview
DocuConvert AI is a professional-grade web application designed to transform complex PDF documents into clean, structured Markdown using Google's Gemini AI models. Beyond simple conversion, it acts as a comprehensive document analysis tool, offering real-time insights, web research grounding, location extraction, and data preparation for vector embeddings.

The application is entirely client-side (SPA), leveraging the `@google/genai` SDK to communicate directly with Google's AI models, ensuring fast processing and high privacy (documents are not stored on intermediate servers).

---

## Tech Spec Snapshot

### Core Architecture
- **Framework**: React 19 (Functional Components & Hooks)
- **Build Tool**: Vite 6.2
- **Language**: TypeScript 5.8
- **Styling**: Tailwind CSS 4.0 (Utility-first, Typography plugin)
- **Animations**: Framer Motion (`motion/react`)
- **Icons**: Lucide React
- **Markdown Rendering**: `react-markdown` with `remark-gfm` (GitHub Flavored Markdown)

### AI Integration (`@google/genai`)
- **Primary Model**: `gemini-3.1-pro-preview` (Used for complex PDF to Markdown conversion)
- **Secondary Model**: `gemini-3-flash-preview` (Used for rapid insights and Web Research Grounding)
- **Tertiary Model**: `gemini-2.5-flash` (Used for Location/Maps Grounding)

### Key Features
1. **PDF to Markdown Conversion**: Preserves headings, lists, and tables using Gemini 3.1 Pro.
2. **Smart Insights**: Generates Executive Summaries, Action Items, and Key Entities using Gemini Flash.
3. **Web Research Assistant**: Answers questions about the document using Google Search Grounding.
4. **Location Assistant**: Extracts and maps locations mentioned in the text using Google Maps Grounding and browser Geolocation.
5. **Vector DB Prep (JSONL Export)**: Chunks the generated Markdown into 5-sentence segments and exports as a `.jsonl` file for embeddings.

---

## APIs & Backend Calls

Because this is a Client-Side SPA, there is no traditional backend. All "backend calls" are direct API requests to Google's Gemini infrastructure via the `@google/genai` SDK.

### 1. Document Conversion (`gemini-3.1-pro-preview`)
- **Input**: Base64 encoded PDF file + System Prompt.
- **Output**: Raw Markdown string.
- **Function**: `convertPdfToMarkdown` in `src/services/gemini.ts`.

### 2. Smart Insights (`gemini-3-flash-preview`)
- **Input**: Extracted Markdown text + Specific Task Prompt (e.g., "Extract action items").
- **Output**: Markdown string containing the requested insight.
- **Function**: `analyzeDocument` in `src/services/gemini.ts`.

### 3. Web Research Grounding (`gemini-3-flash-preview`)
- **Input**: Extracted Markdown text + User Query.
- **Tools**: `[{ googleSearch: {} }]`
- **Output**: Answer text + Array of Grounding Chunks (Source URIs and Titles).
- **Function**: `askResearchAssistant` in `src/services/gemini.ts`.

### 4. Location Maps Grounding (`gemini-2.5-flash`)
- **Input**: Extracted Markdown text + User Query + Optional User Geolocation (`latLng`).
- **Tools**: `[{ googleMaps: {} }]`
- **Output**: Answer text + Array of Map Grounding Chunks (Place URIs and Titles).
- **Function**: `askLocationAssistant` in `src/services/gemini.ts`.

---

## Data Flow & State Management

1. **File Upload**: User drops a PDF -> `FileReader` converts to Base64.
2. **Conversion**: Base64 sent to Gemini 3.1 Pro -> Returns Markdown.
3. **State**: Markdown is stored in React state (`App.tsx`).
4. **Downstream Features**: The Markdown string is passed as `documentContext` props to child components (`SmartInsights`, `ResearchAssistant`, `LocationAssistant`).
5. **Export**: The Markdown string is either downloaded as `.md` or processed by `textProcessing.ts` (chunked into sentences) and downloaded as `.jsonl`.

---

## Enhancement Suggestions & Future Roadmap

### 1. Performance & Scalability
- **Streaming Responses**: Implement `generateContentStream` for the initial PDF conversion to show the Markdown generating in real-time, improving perceived performance for large documents.
- **Web Workers**: Move the Base64 encoding and JSONL chunking logic to a Web Worker to prevent UI blocking on massive PDFs.

### 2. User Experience (UX)
- **Document History**: Implement `indexedDB` to save previously converted documents locally in the browser so users don't lose their work if they refresh.
- **Editable Markdown**: Replace the static `react-markdown` preview with an editable Markdown component (like Monaco Editor or CodeMirror) so users can tweak the AI's output before exporting.

### 3. Advanced AI Features
- **Custom Chunking Strategies**: Allow users to configure the JSONL export settings in the UI (e.g., chunk by paragraphs, chunk by token count, adjust overlap) instead of hardcoding 5 sentences.
- **Multi-Document Chat**: Allow uploading multiple PDFs and use Gemini's context window to chat across all of them simultaneously.

### 4. Architecture
- **Backend Migration (Optional)**: If API key security becomes a concern for public deployment, migrate the `@google/genai` calls to a lightweight Express/Node.js backend to keep the `GEMINI_API_KEY` hidden from the client.
