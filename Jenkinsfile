
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
                '''
            }
        }

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

                        sh '''
                            echo "$DOCKER_TOKEN" | docker login \
                                -u "$DOCKER_USER" --password-stdin

                            docker tag \
                                ${IMAGE_NAME}:${BUILD_NUMBER} \
                                ${DOCKERHUB_IMAGE}:jenkins-${BUILD_NUMBER}
                        '''

                        try {
                            retry(3) {
                                sh '''
                                    docker push \
                                    ${DOCKERHUB_IMAGE}:jenkins-${BUILD_NUMBER}
                                '''
                            }
                        } finally {
                            sh 'docker logout || true'
                        }
                    }
                }
            }
        }


       stage('Deploy to Kubernetes') {
    steps {
        echo 'Deploying backend using Docker Hub image'

        sh '''
            helm upgrade --install jenkins-app ./helm/jenkins-app \
              --namespace jenkins-app \
              --set-string backend.image=${DOCKERHUB_IMAGE}:jenkins-${BUILD_NUMBER} \
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

    stage('Test Claude API') {
    steps {
        withCredentials([
            string(
                credentialsId: 'claude-api-key',
                variable: 'ANTHROPIC_API_KEY'
            )
        ]) {
            sh 'node script/ai.js'
        }
    }
}

 }
}
