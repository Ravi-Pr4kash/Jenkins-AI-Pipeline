
pipeline {
    agent any

    environment {
        PATH = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
        KUBECONFIG = "/Users/raviprakash/.kube/config"
        IMAGE_NAME = "jenkins-backend"
    }

    stages {

        stage('Install & Test') {
            steps {
                echo 'Installing dependencies and running tests'

                sh '''
                    docker run --rm \
                      -v "$WORKSPACE/backend:/app" \
                      -w /app \
                      node:22-alpine \
                      sh -c 'npm ci && npm test'
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Building backend Docker image'

                sh '''
                    docker build \
                      -t ${IMAGE_NAME}:${BUILD_NUMBER} \
                      ./backend

                    docker images ${IMAGE_NAME}
                '''
            }
        }
    }
}
