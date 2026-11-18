
pipeline {
    agent any

    options {
        disableConcurrentBuilds()
    }

    environment {
        PATH = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
        KUBECONFIG = "/Users/raviprakash/.kube/config"

        IMAGE_NAME = "jenkins-backend"
        DOCKERHUB_IMAGE = "raviiprakashh/my-backend"
    }

    stages {

        // 1. Install dependencies and run tests
        stage('Install & Test') {
            steps {
                echo 'Installing dependencies and running tests'

                sh '''
                    #!/bin/bash
                    set -euo pipefail

                    : > "$WORKSPACE/pipeline.log"

                    docker run --rm \
                      -v "$WORKSPACE/backend:/app" \
                      -w /app \
                      node:22-alpine \
                      sh -c 'npm ci && npm test' \
                      2>&1 | tee -a "$WORKSPACE/pipeline.log"
                '''
            }
        }

        // 2. Build Docker image
        stage('Build Docker Image') {
            steps {
                echo 'Building backend Docker image'

                sh '''
                    #!/bin/bash
                    set -euo pipefail

                    docker build \
                      -t ${IMAGE_NAME}:${BUILD_NUMBER} \
                      ./backend \
                      2>&1 | tee -a "$WORKSPACE/pipeline.log"
                '''
            }
        }

        // 3. Push Docker image
        stage('Push to Docker Hub') {
            steps {
                script {
                    withCredentials([
                        usernamePassword(
                            credentialsId: 'dockerhub-creds',
                            usernameVariable: 'DOCKER_USER',
                            passwordVariable: 'DOCKER_TOKEN'
                        )
                    ]) {

                        try {
                            sh '''
                                #!/bin/bash
                                set -euo pipefail
                                set +x

                                echo "$DOCKER_TOKEN" | docker login \
                                  -u "$DOCKER_USER" \
                                  --password-stdin \
                                  2>&1 | tee -a "$WORKSPACE/pipeline.log"

                                docker tag \
                                  ${IMAGE_NAME}:${BUILD_NUMBER} \
                                  ${DOCKERHUB_IMAGE}:jenkins-${BUILD_NUMBER} \
                                  2>&1 | tee -a "$WORKSPACE/pipeline.log"
                            '''

                            retry(3) {
                                sh '''
                                    #!/bin/bash
                                    set -euo pipefail

                                    docker push \
                                      ${DOCKERHUB_IMAGE}:jenkins-${BUILD_NUMBER} \
                                      2>&1 | tee -a "$WORKSPACE/pipeline.log"
                                '''
                            }

                        } finally {
                            sh 'docker logout || true'
                        }
                    }
                }
            }
        }

        // 4. Deploy to Kubernetes using Helm
        stage('Deploy to Kubernetes') {
            steps {
                echo 'Deploying backend using Docker Hub image'

                sh '''
                    #!/bin/bash
                    set -euo pipefail

                    helm upgrade --install jenkins-app ./helm/jenkins-app \
                      --namespace jenkins-app \
                      --set-string backend.image=${DOCKERHUB_IMAGE}:jenkins-${BUILD_NUMBER} \
                      --wait \
                      --timeout 3m \
                      2>&1 | tee -a "$WORKSPACE/pipeline.log"

                    echo "Checking backend rollout..."

                    kubectl rollout status deployment/backend \
                      -n jenkins-app \
                      --timeout=180s \
                      2>&1 | tee -a "$WORKSPACE/pipeline.log"

                    echo "Checking Kubernetes pods..."

                    kubectl get pods -n jenkins-app \
                      2>&1 | tee -a "$WORKSPACE/pipeline.log"
                '''
            }
        }
    }

    // Run AI diagnosis only when a pipeline stage fails
    post {

        failure {
            script {
                echo "Pipeline failed! Sending logs to Claude AI..."

                try {
                    withCredentials([
                        string(
                            credentialsId: 'claude-api-key',
                            variable: 'ANTHROPIC_API_KEY'
                        )
                    ]) {
                        sh '''
                            node script/failure.js pipeline.log
                        '''
                    }

                } catch (err) {
                    echo "AI diagnosis could not run: ${err.message}"
                }
            }
        }

        // Save logs as a Jenkins build artifact
        always {
            archiveArtifacts(
                artifacts: 'pipeline.log',
                allowEmptyArchive: true
            )
        }
    }
}
