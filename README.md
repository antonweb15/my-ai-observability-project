# AI Observability Framework

[![NestJS](https://img.shields.io/badge/Framework-NestJS-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![LangChain](https://img.shields.io/badge/Orchestration-LangChain-1C3C3C?logo=langchain&logoColor=white)](https://js.langchain.com/)
[![Gemini](https://img.shields.io/badge/LLM-Google%20Gemini-4285F4?logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Langfuse](https://img.shields.io/badge/Observability-Langfuse-000000?logo=langfuse&logoColor=white)](https://langfuse.com/)

A production-ready framework for building, monitoring, and optimizing AI-powered applications. This project implements **Clean Architecture** to decouple business logic from AI providers and infrastructure.

## 🚀 Key Features

- **Advanced Observability**: Full trace lifecycle, latency monitoring, and cost tracking via Langfuse.
- **RAG & External Streaming**: Built-in Retrieval-Augmented Generation with Supabase Vector Store and real-time SEO generation through Flowise.
- **Clean Architecture**: Core logic separated from Infrastructure (LLMs, Databases).
- **Automated Scoring**: Real-time evaluation of LLM outputs (JSON validation, relevance, etc.).
- **Multi-Provider Support**: Interface-driven design to easily switch between Gemini, OpenAI, or Anthropic.

## 🛠 Tech Stack

- **Backend**: NestJS (Node.js)
- **AI Engine**: LangChain & Google Generative AI
- **Vector DB**: Supabase (PostgreSQL + pgvector)
- **Monitoring**: Langfuse (Open-source observability)
- **Validation**: Custom evaluation pipelines

## 🏗 Architecture Overview

The project follows the **Hexagonal/Clean Architecture** pattern:

- **Core**: Domain entities and use cases (the heart of the app).
- **Ports**: Interfaces defining how the core interacts with the outside world.
- **Infrastructure/Adapters**: Implementations for specific services (Supabase, Langfuse, LLM Providers).
- **Presentation**: Entry points (API controllers, CLI).

## 🚦 Getting Started

### Prerequisites

- Node.js v18+ and npm
- Google AI Studio access (API Key)
- Supabase project (with Vector enabled)
- Langfuse instance (Cloud or self-hosted)

### Installation

```bash
# Clone the repository
git clone git@github.com:antonweb15/ai-observability.git
cd ai-observability

# Install dependencies
npm install
```

### Environment Configuration

Create a `.env` file in the root:

```env
# LLM Providers
GOOGLE_API_KEY=your_key_here

# Vector Store
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key

# Observability
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_SECRET_KEY=sk-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com

# External Services
FLOWISE_BASE_URL=http://localhost:3005
```

### Running the System

```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

## 🧪 Testing & Quality

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

## 🐳 Docker & CI/CD

The project is containerized using Docker and automated via GitHub Actions.

### Local Docker Build

To build and run the application locally via Docker:

```bash
# Build the image
docker build -t ai-observability-project .

# Run the container
docker run -p 3000:3000 --env-file .env ai-observability-project
```

---
Built with ❤️ for AI Engineers.
