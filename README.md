# Jenkins CI/CD Pipeline with Claude AI

An automated CI/CD pipeline that builds, tests, and deploys a Node.js backend application to Kubernetes using Jenkins, Docker, and Helm. Integrated with Claude AI for automatic pipeline failure analysis.

## Tech Stack
- **CI/CD:** Jenkins, GitHub Webhooks
- **Containerization:** Docker, Docker Hub
- **Orchestration:** Kubernetes, Minikube, Helm
- **Backend:** Node.js, Express
- **Database:** PostgreSQL, Redis
- **AI:** Claude API

## Pipeline Workflow

1. Developer pushes code to GitHub.
2. GitHub webhook triggers Jenkins.
3. Jenkins installs dependencies and runs tests.
4. Builds and pushes Docker image to Docker Hub.
5. Deploys the application to Kubernetes using Helm.
6. On pipeline failure, Claude AI analyzes logs and provides root-cause diagnosis and suggested fixes.

## AI Failure Diagnosis

- Automatically captures pipeline logs.
- Sends logs to Claude API.
- Identifies errors and possible root causes.
- Provides troubleshooting suggestions in Jenkins Console Output.

## Project Structure

```text
├── backend/
├── helm/
├── script/
│   ├── ai.js
│   └── failure.js
├── Jenkinsfile
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Key Features

- Automated CI/CD using Jenkins.
- GitHub webhook integration.
- Docker image build and push.
- Kubernetes deployment using Helm.
- PostgreSQL and Redis integration.
- AI-powered pipeline failure diagnosis.

**Goal:** Combining DevOps automation with AI-powered troubleshooting.