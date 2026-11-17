
pipeline {
    agent any

    environment {
        PATH = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
        KUBECONFIG = "/Users/raviprakash/.kube/config"

        IMAGE_NAME = "jenkins-backend"
        DOCKERHUB_IMAGE = "raviiprakashh/my-backend"
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

        stage('Push to Docker Hub') {
    steps {
        withCredentials([
            usernamePassword(
                credentialsId: 'dockerhub-creds',
                usernameVariable: 'DOCKER_USER',
                passwordVariable: 'DOCKER_TOKEN'
            )
        ]) {
            sh '''
                echo "$DOCKER_TOKEN" | docker login \
                    -u "$DOCKER_USER" --password-stdin
            '''

            retry(3) {
                sh '''
                    docker push \
                    raviiprakashh/my-backend:jenkins-${BUILD_NUMBER}
                '''
            }

            sh 'docker logout'
        }
    }
}
        stage('Load Image into Minikube') {
            steps {
                echo 'Loading Docker image into Minikube'

                sh '''
                    minikube image load ${IMAGE_NAME}:${BUILD_NUMBER}

                    minikube image ls | grep ${IMAGE_NAME}
                '''
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo 'Deploying backend using Helm'

                sh '''
                    helm upgrade --install jenkins-app ./helm/jenkins-app \
                      --namespace jenkins-app \
                      --set-string backend.image=${IMAGE_NAME}:${BUILD_NUMBER} \
                      --wait \
                      --timeout 3m

                    echo "Checking backend rollout..."

                    kubectl rollout status deployment/backend \
                      -n jenkins-app \
                      --timeout=180s

                    kubectl get pods -n jenkins-app
                '''
            }
        }

    }
}
