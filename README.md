# Jenkins AI-Powered CI/CD Pipeline

An automated CI/CD pipeline that integrates **GitHub, Jenkins, Docker, Docker Hub, Kubernetes, and Helm** to automate application testing, containerization, image publishing, and deployment.

The project uses Jenkins running locally on macOS and Minikube as a local Kubernetes cluster. GitHub webhooks automatically trigger Jenkins whenever new code is pushed to the repository.

## Project Overview

Traditionally, developers manually test applications, build Docker images, push them to container registries, and deploy them to servers.

This project automates that entire workflow.

Whenever a developer pushes code to GitHub:

1. GitHub sends a webhook notification to Jenkins.
2. Jenkins checks out the latest source code.
3. Jenkins installs dependencies and runs backend tests.
4. Jenkins builds a Docker image of the backend.
5. Jenkins pushes the image to Docker Hub.
6. Kubernetes pulls the newly published image from Docker Hub.
7. Helm upgrades the Kubernetes deployment.
8. Kubernetes performs a rolling update of the backend application.

The objective is to create an automated deployment workflow that requires no manual intervention after pushing code.

## Architecture

```text
                 Developer
                     |
                     | git push
                     v
               GitHub Repository
                     |
                     | Webhook
                     v
                  ngrok
                     |
                     v
              Jenkins (macOS)
                     |
             +-------+-------+
             |       |       |
             v       v       v
           Install  Docker  Build
           & Test   Build   Image
                             |
                             v
                         Docker Hub
                             |
                             | Pull Image
                             v
                     Minikube Cluster
                             |
                             v
                       Helm Upgrade
                             |
                             v
                    Kubernetes Deployment
                             |
                             v
                       Backend Running
```

## Technology Stack

| Technology | Purpose |
|---|---|
| Git & GitHub | Source code management |
| GitHub Webhooks | Automatic pipeline triggering |
| ngrok | Exposes local Jenkins to GitHub |
| Jenkins | CI/CD automation |
| Node.js | Backend runtime and testing |
| Docker | Application containerization |
| Docker Hub | Container image registry |
| Kubernetes | Container orchestration |
| Minikube | Local Kubernetes cluster |
| Helm | Kubernetes deployment management |
| PostgreSQL | Application database |
| Redis | In-memory data store |

## Project Structure

```text
Jenkins-AI-Pipeline/
│
├── .github/
│   └── workflows/
│
├── backend/
│   ├── src/
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   └── .dockerignore
│
├── helm/
│   └── jenkins-app/
│       ├── templates/
│       │   ├── backend-configmap.yaml
│       │   ├── backend-deployment.yaml
│       │   ├── backend-service.yaml
│       │   ├── postgres-secret.yaml
│       │   ├── postgres-service.yaml
│       │   ├── postgres-statefulset.yaml
│       │   ├── redis-deployment.yaml
│       │   └── redis-service.yaml
│       │
│       ├── Chart.yaml
│       └── values.yaml
│
├── docker-compose.yml
└── Jenkinsfile
```

## Prerequisites

Install the following tools on macOS:

- Docker Desktop
- Homebrew
- Git
- Node.js
- kubectl
- Minikube
- Helm
- Jenkins
- ngrok

Install the Kubernetes tools:

```bash
brew install kubectl minikube helm
```

Install Jenkins:

```bash
brew install jenkins-lts
```

Install ngrok:

```bash
brew install ngrok
```

Make sure Docker Desktop is installed and running before starting Minikube.

## 1. Start the Infrastructure

Start Jenkins:

```bash
brew services start jenkins-lts
```

Access Jenkins:

```text
http://localhost:8080
```

If this is your first installation, retrieve the initial administrator password:

```bash
cat ~/.jenkins/secrets/initialAdminPassword
```

Start Minikube:

```bash
minikube start
```

Verify Kubernetes:

```bash
minikube status
kubectl get nodes
```

Verify Helm:

```bash
helm version
```

## 2. Configure Jenkins

Install or enable the required Jenkins plugins:

- Pipeline
- Git
- GitHub
- Credentials Binding

Configure the Docker Hub credentials:

1. Open Manage Jenkins.
2. Navigate to Credentials → System → Global.
3. Click Add Credentials.
4. Select Username with password.
5. Enter your Docker Hub username.
6. Use a Docker Hub access token as the password.
7. Set the ID to:

```text
dockerhub-creds
```

This allows Jenkins to authenticate with Docker Hub without exposing credentials in the Jenkinsfile.

## 3. Configure GitHub Webhook

Since Jenkins is running locally, GitHub cannot directly access localhost.

Use ngrok to expose Jenkins temporarily:

```bash
ngrok http 8080
```

Copy the HTTPS forwarding URL.

In GitHub:

1. Open repository Settings.
2. Navigate to Webhooks.
3. Click Add webhook.
4. Configure the payload URL:

```text
https://YOUR-NGROK-URL/github-webhook/
```

5. Set Content type to `application/json`.
6. Select Just the push event.
7. Keep the webhook active.

In Jenkins:

1. Open the pipeline job.
2. Click Configure.
3. Navigate to Build Triggers.
4. Enable GitHub hook trigger for GITScm polling.
5. Save the configuration.

Now GitHub pushes can automatically trigger Jenkins builds.

**Important:** Keep ngrok running while using this webhook. If its forwarding URL changes, update the GitHub webhook URL.

## 4. Jenkins Pipeline

The `Jenkinsfile` defines the complete CI/CD workflow.

### Stage 1: Install and Test

Jenkins runs the backend tests inside a temporary Node.js Docker container.

```bash
docker run --rm \
  -v "$WORKSPACE/backend:/app" \
  -w /app \
  node:22-alpine \
  sh -c 'npm ci && npm test'
```

This installs dependencies and executes the backend test script without requiring Node.js dependencies to be installed directly on the Jenkins host.

### Stage 2: Build Docker Image

Jenkins builds the backend Docker image.

```bash
docker build \
  -t jenkins-backend:${BUILD_NUMBER} \
  ./backend
```

Each Jenkins build receives a unique image tag based on its build number.

### Stage 3: Push to Docker Hub

Jenkins authenticates using the stored Docker Hub credentials.

The image is tagged and pushed to:

```text
raviiprakashh/my-backend
```

Example image:

```text
raviiprakashh/my-backend:jenkins-14
```

The repository is public, so Kubernetes can pull the image without an image pull secret.

### Stage 4: Deploy to Kubernetes

Jenkins uses Helm to deploy the new backend image.

Conceptually, the deployment command is:

```bash
helm upgrade --install jenkins-app ./helm/jenkins-app \
  --namespace jenkins-app \
  --set-string backend.image=raviiprakashh/my-backend:jenkins-${BUILD_NUMBER} \
  --wait \
  --timeout 3m
```

Helm updates the Kubernetes deployment using the newly published Docker Hub image.

Kubernetes then pulls the image and creates the updated backend pod.

### Stage 5: Verify Deployment

Jenkins verifies the rollout:

```bash
kubectl rollout status deployment/backend \
  -n jenkins-app \
  --timeout=180s
```

Check running pods:

```bash
kubectl get pods -n jenkins-app
```

The pipeline succeeds only when the deployment rollout completes successfully.

## 5. Running the Project

Once everything is configured, the normal development workflow is simple.

**Step 1:** Make changes to your backend application.

**Step 2:** Commit and push your changes:

```bash
git add .
git commit -m "Update backend application"
git push origin main
```

**Step 3:** GitHub automatically sends a webhook to Jenkins.

**Step 4:** Jenkins starts the pipeline automatically.

**Step 5:** Monitor the pipeline from:

```text
http://localhost:8080
```

**Step 6:** Verify the Kubernetes deployment:

```bash
kubectl get pods -n jenkins-app
kubectl get deployments -n jenkins-app
helm list -n jenkins-app
```

No manual Build Now click is required.

## 6. Verify Docker Hub Images

Check the published images in your Docker Hub repository:

[Docker Hub - my-backend](https://hub.docker.com/repository/docker/raviiprakashh/my-backend)

Example:

```text
raviiprakashh/my-backend:jenkins-12
raviiprakashh/my-backend:jenkins-13
raviiprakashh/my-backend:jenkins-14
```

Each successful pipeline build publishes a uniquely tagged image.

## 7. Kubernetes Resources

The Helm chart manages the application's Kubernetes resources.

| Resource | Responsibility |
|---|---|
| Deployment | Runs backend containers |
| Service | Provides internal backend networking |
| ConfigMap | Stores backend configuration |
| Secret | Stores PostgreSQL password |
| StatefulSet | Manages PostgreSQL |
| Service | Provides PostgreSQL networking |
| Deployment | Runs Redis |
| Service | Provides Redis networking |

All application resources are deployed in the `jenkins-app` namespace.

## 8. Useful Commands

**Jenkins**

```bash
brew services start jenkins-lts
brew services stop jenkins-lts
brew services info jenkins-lts
```

**Minikube**

```bash
minikube start
minikube status
minikube dashboard
minikube stop
```

**Kubernetes**

```bash
kubectl get nodes
kubectl get pods -A
kubectl get services -n jenkins-app
kubectl describe pod POD_NAME -n jenkins-app
kubectl logs POD_NAME -n jenkins-app
```

**Helm**

```bash
helm list -A
helm status jenkins-app -n jenkins-app
helm history jenkins-app -n jenkins-app
helm get values jenkins-app -n jenkins-app
```

**Docker**

```bash
docker images
docker ps
docker image ls
```

## Future Improvements

The project can be extended with the following capabilities:

- AI-powered Jenkins build failure diagnosis.
- Automatic analysis of failed pipeline logs.
- AI-generated suggestions for fixing build errors.
- Pull request code review using AI.
- Prometheus and Grafana monitoring.
- Kubernetes Horizontal Pod Autoscaling.
- Automated rollback on deployment failure.
- Production deployment to a cloud Kubernetes cluster.

## Project Goal

The goal of this project is to understand and implement a real-world DevOps workflow by integrating source control, continuous integration, containerization, image registries, Kubernetes orchestration, and automated deployment.

It demonstrates how a simple Git push can trigger an entire CI/CD pipeline and deploy an updated application without manual intervention.

---

**Repository:** [Jenkins-AI-Pipeline](https://github.com/Ravi-Pr4kash/Jenkins-AI-Pipeline)

**Docker Hub:** [raviiprakashh/my-backend](https://hub.docker.com/repository/docker/raviiprakashh/my-backend)