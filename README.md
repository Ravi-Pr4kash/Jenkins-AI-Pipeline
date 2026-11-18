# Jenkins AI-Powered CI/CD Pipeline

An automated CI/CD pipeline that uses Jenkins, Docker, Docker Hub, and Kubernetes to test, build, and deploy a Node.js backend application.

## Overview

Whenever code is pushed to GitHub, a webhook automatically triggers Jenkins, which executes the complete deployment pipeline.

## Tech Stack

- **Jenkins** – CI/CD automation
- **GitHub Webhooks** – Automatic pipeline triggering
- **Docker** – Containerization
- **Docker Hub** – Image registry
- **Kubernetes (Minikube)** – Container orchestration
- **Helm** – Kubernetes deployment management
- **Node.js** – Backend application
- **PostgreSQL & Redis** – Data storage and caching
- **ngrok** – Exposes local Jenkins to GitHub

## CI/CD Workflow

```text
Developer Push
      |
      v
GitHub Webhook
      |
      v
    Jenkins
      |
      v
 Install & Test
      |
      v
 Build Docker Image
      |
      v
 Push to Docker Hub
      |
      v
 Kubernetes (Minikube)
      |
      v
 Helm Deployment
      |
      v
 Backend Running
```

## Getting Started

**1. Start Jenkins**

```bash
brew services start jenkins-lts
```

Access: http://localhost:8080

**2. Start Minikube**

```bash
minikube start
kubectl get nodes
```

**3. Start ngrok**

```bash
ngrok http 8080
```

Configure its HTTPS URL as your GitHub repository webhook endpoint:

```text
https://YOUR-NGROK-URL/github-webhook/
```

Enable **GitHub hook trigger for GITScm polling** in your Jenkins job.

**4. Run the pipeline**

Push your code to GitHub:

```bash
git add .
git commit -m "Update application"
git push origin main
```

Jenkins automatically executes the pipeline and deploys the updated application to Kubernetes.

## Useful Commands

```bash
kubectl get pods -n jenkins-app
kubectl get deployments -n jenkins-app
helm list -n jenkins-app
minikube status
```

## Future Improvements

- AI-powered build failure diagnosis
- AI-based code review
- Prometheus and Grafana monitoring
- Automated deployment rollback

## Links

- [GitHub Repository](https://github.com/Ravi-Pr4kash/Jenkins-AI-Pipeline)
- [Docker Hub](https://hub.docker.com/repository/docker/raviiprakashh/my-backend)