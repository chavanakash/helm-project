pipeline {
    agent any

    environment {
        IMAGE_TAG = "${new Date().format('yyyyMMdd')}-${env.BUILD_NUMBER}"
    }

    triggers {
        githubPush()
    }

    stages {

        stage("Checkout") {
            steps {
                checkout scm
            }
        }

        stage("Check Branch") {
            steps {
                script {
                    if (env.GIT_BRANCH != 'origin/main') {
                        currentBuild.result = 'ABORTED'
                        error("Pipeline runs only on main branch. Skipping branch: ${env.GIT_BRANCH}")
                    }
                }
            }
        }

        stage("Build Images") {
            parallel {
                stage("Frontend") {
                    steps {
                        sh "docker build -t dockerizzz/frontend:${IMAGE_TAG} -t dockerizzz/frontend:latest ./FRONTEND"
                    }
                }
                stage("Backend") {
                    steps {
                        sh "docker build -t dockerizzz/backend:${IMAGE_TAG} -t dockerizzz/backend:latest ./BACKEND"
                    }
                }
            }
        }

        stage("Test") {
            steps {
                dir("BACKEND") {
                    sh "npm install"
                    sh "npm test --if-present"
                }
            }
        }

        stage("Push Images") {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "dockerhub-credentials",
                    usernameVariable: "DOCKER_USER_LOGIN",
                    passwordVariable: "DOCKER_PASS"
                )]) {
                    sh "echo $DOCKER_PASS | docker login -u $DOCKER_USER_LOGIN --password-stdin"
                    sh "docker push dockerizzz/frontend:${IMAGE_TAG}"
                    sh "docker push dockerizzz/frontend:latest"
                    sh "docker push dockerizzz/backend:${IMAGE_TAG}"
                    sh "docker push dockerizzz/backend:latest"
                }
            }
        }

        stage("Update Image Tags") {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "github-credentials",
                    usernameVariable: "GIT_USER",
                    passwordVariable: "GIT_TOKEN"
                )]) {
                    sh """
                        git config user.email "jenkins@ci"
                        git config user.name "Jenkins"

                        sed -i 's|tag: .*  # frontend|tag: ${IMAGE_TAG}  # frontend|' HELM/DEVOPS-APP/values.yaml
                        sed -i 's|tag: .*  # backend|tag: ${IMAGE_TAG}  # backend|' HELM/DEVOPS-APP/values.yaml

                        git add HELM/DEVOPS-APP/values.yaml
                        git commit -m "ci: update image tags to ${IMAGE_TAG} [skip ci]"
                        git push https://\${GIT_USER}:\${GIT_TOKEN}@github.com/chavanakash/helm-project.git HEAD:main
                    """
                }
            }
        }

    }

    post {
        always {
            sh "docker logout || true"
        }
        success {
            echo "✅ Build #${IMAGE_TAG} pushed — ArgoCD will deploy shortly"
        }
        failure {
            echo "❌ Pipeline failed — check logs above"
        }
    }
}