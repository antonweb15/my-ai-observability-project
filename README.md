# AI Observability Framework

[![NestJS](https://img.shields.io/badge/Framework-NestJS-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![LangChain](https://img.shields.io/badge/Orchestration-LangChain-1C3C3C?logo=langchain&logoColor=white)](https://js.langchain.com/)
[![Flowise](https://img.shields.io/badge/Low--Code-Flowise-red?logo=flowise&logoColor=white)](https://flowiseai.com/)
[![Gemini](https://img.shields.io/badge/LLM-Google%20Gemini-4285F4?logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Langfuse](https://img.shields.io/badge/Observability-Langfuse-000000?logo=langfuse&logoColor=white)](https://langfuse.com/)

A production-ready framework for building, monitoring, and optimizing AI-powered applications. This project implements **Clean Architecture** and acts as an **API Gateway** to decouple business logic from AI providers and infrastructure.

## 🚀 Key Features

- **API Gateway Architecture**: NestJS handles validation, fault tolerance, and background job processing (BullMQ).
- **Real-time Streaming**: Direct response delivery via Chunked Transfer / Server-Sent Events (SSE) from LLM.
- **RAG Implementation**: Custom Retrieval-Augmented Generation pipeline using LangChain and Supabase.
- **Advanced Observability**: Full trace lifecycle, latency monitoring, and cost tracking via **Langfuse Cloud**.
- **Automated Scoring (Quality Gate)**: Real-time evaluation of LLM outputs (JSON validity) with automated feedback loop to Langfuse.
- **Strict Data Structure**: Guaranteed JSON output (title, meta_description, h1, description, bullets).
- **Background Processing**: Asynchronous SEO generation using **BullMQ** and **Redis**.

## 🛠 Tech Stack

- **Backend**: NestJS (Architecture of controllers/services, RxJS, Streaming/SSE, Express/Fastify)
- **AI Orchestration**: LangChain (Core logic for RAG and LLM interaction)
- **Models (Google AI Studio)**:
    - **Gemini 3.1 Flash Lite**: Primary LLM for generation.
    - **text-embedding-004**: Model for semantic vector creation.
- **Vector DB**: Supabase Cloud with **pgvector** (Cosine similarity, `match_documents` function).
- **Monitoring**: Langfuse Cloud (Tracing, Prompt Registry, Token/Cost metrics).
- **Job Queue**: BullMQ & Redis (Background task management).
- **Network Layer**: Axios (Stream reading for external integrations if any).
- **DevOps**: Docker (Multi-stage builds), GitHub Actions, GHCR (GitHub Container Registry).

## 🏗 Data Pipeline & Architecture

1. **Request**: NestJS receives `product_name`, `category`, and `keywords`.
2. **Retrieval**: Query is vectorized via `text-embedding-004`. Semantic search is performed in Supabase (pgvector) to find relevant context/examples.
3. **Augmentation**: Context is retrieved and injected into a prompt template managed via **Langfuse Prompt Registry**.
4. **Generation**: Prompt is sent to **Gemini 3.1 Flash Lite**. A stream or a direct response is handled by NestJS.
5. **Observability**: Every step is logged in **Langfuse**. NestJS performs software-based scoring (`valid_json: 1/0`) and updates the trace.
6. **Processing**: Request can be handled instantly (streaming) or pushed to a **BullMQ** queue for background processing.

## 🚦 Getting Started

### Prerequisites

- Node.js v18+ and npm
- Google AI Studio access (API Key)
- Supabase project (with Vector enabled)
- Langfuse instance (Cloud or self-hosted)
- Redis server (for background jobs)

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

# Redis (for background jobs)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Running the System

```bash
# Start infrastructure (Redis)
docker-compose up -d

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

The project is fully containerized and automated.

- **Docker**: Multi-stage builds for optimized image size.
- **Network**: Isolated network with port forwarding (3005:3000 for Flowise).
- **CI/CD**: GitHub Actions pipeline for testing, linting, and building.
- **Registry**: Immutable Docker images are published to **GitHub Container Registry (GHCR)**.
- **Deployment**: Supports **Zero-Downtime Rolling Update** strategies (e.g., Azure Container Apps).

---
Built with ❤️ for AI Engineers.
