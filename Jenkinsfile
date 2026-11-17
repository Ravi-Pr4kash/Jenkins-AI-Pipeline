
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
