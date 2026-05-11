# AI Observability Project

A NestJS-based project demonstrating AI observability using Langfuse, Google Gemini (LangChain), and Supabase Vector Store.

## Features

- **AI Pipeline**: Integrated with Google Gemini for text generation.
- **RAG (Retrieval-Augmented Generation)**: Uses Supabase Vector Store to provide context to the LLM.
- **Observability**: Complete trace tracking and quality scoring with Langfuse.
- **Automated Scoring**: Checks if the AI response is valid JSON and logs scores to Langfuse.

## Tech Stack

- **Framework**: [NestJS](https://nestjs.com/)
- **AI Orchestration**: [LangChain](https://js.langchain.com/)
- **LLM**: [Google Gemini](https://ai.google.dev/)
- **Observability**: [Langfuse](https://langfuse.com/)
- **Database**: [Supabase](https://supabase.com/) (Vector Store)

## Getting Started

### Prerequisites

- Node.js (v18+)
- Supabase account and project
- Google AI API Key (Gemini)
- Langfuse account (self-hosted or cloud)

### Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:antonweb15/my-ai-observability-project.git
   cd ai-observability
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   Create a `.env` file based on the required configuration:
   ```env
   GOOGLE_API_KEY=your_google_api_key
   
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
   
   LANGFUSE_PUBLIC_KEY=your_langfuse_public_key
   LANGFUSE_SECRET_KEY=your_langfuse_secret_key
   LANGFUSE_BASE_URL=https://cloud.langfuse.com
   ```

### Running the App

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## TODO

- [ ] Add more comprehensive tests for the AI pipeline.
- [ ] Implement advanced RAG techniques (e.g., hybrid search).
- [ ] Add a frontend dashboard for viewing generated SEO content.
- [ ] Expand the scoring module with more metrics (relevance, tone, etc.).

## License

This project is [UNLICENSED](LICENSE).
