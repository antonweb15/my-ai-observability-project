# AI Observability Framework

[![NestJS](https://img.shields.io/badge/Framework-NestJS-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![LangChain](https://img.shields.io/badge/Orchestration-LangChain-1C3C3C?logo=langchain&logoColor=white)](https://js.langchain.com/)
[![Gemini](https://img.shields.io/badge/LLM-Google%20Gemini-4285F4?logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Langfuse](https://img.shields.io/badge/Observability-Langfuse-000000?logo=langfuse&logoColor=white)](https://langfuse.com/)

A production-ready framework for building, observing, and optimizing AI-driven applications. This project leverages **Clean Architecture** to decouple business logic from AI providers and infrastructure.

## 🚀 Key Features

- **Advanced Observability**: Full-lifecycle tracing, latency monitoring, and cost tracking via Langfuse.
- **RAG-Enabled**: Built-in Retrieval-Augmented Generation using Supabase Vector Store.
- **Clean Architecture**: Decoupled "Core" logic from "Infrastructure" (LLMs, Databases).
- **Automated Evaluation**: Real-time scoring of LLM outputs (JSON validation, relevance, etc.).
- **Multi-Provider Ready**: Interface-driven design allows easy switching between Gemini, OpenAI, or Anthropic.

## 🛠 Tech Stack

- **Backend**: NestJS (Node.js)
- **AI Engine**: LangChain & Google Generative AI
- **Vector DB**: Supabase (PostgreSQL + pgvector)
- **Monitoring**: Langfuse (Open-source observability)
- **Validation**: Custom scoring pipelines

## 🏗 Architecture Overview

The project follows the **Hexagonal/Clean Architecture** pattern:

- **Core**: Domain entities and use-cases (the "Heart" of the app).
- **Ports**: Interfaces defining how the Core communicates with the outside world.
- **Infrastructure/Adapters**: Implementations for specific services (Supabase, Langfuse, LLM providers).
- **Presentation**: Entry points (API Controllers, CLI).

## 🚦 Getting Started

### Prerequisites

- Node.js v18+ & npm
- Access to Google AI Studio (API Key)
- Supabase Project (with Vector enabled)
- Langfuse Instance (Cloud or Self-hosted)

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

# Vector Storage
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key

# Observability
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_SECRET_KEY=sk-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com
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

This project is containerized using Docker and automated with GitHub Actions.

### Local Docker Build

To build and run the application locally using Docker:

```bash
# Build the image
docker build -t ai-observability-project .

# Run the container
docker run -p 3000:3000 --env-file .env ai-observability-project
```

### GitHub Container Registry (GHCR)

The CI/CD pipeline automatically builds and pushes the Docker image to GHCR on every push to `main` or `master` branches.

**To pull the latest image:**

```bash
docker pull ghcr.io/<your-github-username>/ai-observability-project:latest
```

**Deployment example (Azure Container Apps):**

```bash
az containerapp update \
  --name ai-observability-app \
  --resource-group your-resource-group \
  --image ghcr.io/<your-github-username>/ai-observability-project:latest
```

## 🗺 Roadmap

- [ ] Support for OpenAI and Anthropic providers.
- [ ] Advanced hybrid search (Keyword + Vector).
- [ ] UI Dashboard for prompt management.
- [ ] Integration with LangGraph for complex agentic flows.

---
Managed with ❤️ for AI Engineers.
