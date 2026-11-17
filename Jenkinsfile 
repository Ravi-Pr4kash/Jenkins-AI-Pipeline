
pipeline {
    agent any

    stages {
        stage('Checkout Verification') {
            steps {
                echo 'Jenkins successfully pulled the repository!'

                sh '''
                    echo "Repository contents:"
                    ls -la

                    echo "Backend contents:"
                    ls -la backend

                    echo "Helm chart contents:"
                    ls -la helm/jenkins-app
                '''
            }
        }
    }
}
