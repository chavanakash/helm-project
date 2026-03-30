pipeline {
    agent any

    environment {
        IMAGE_TAG    = "${env.BUILD_NUMBER}"
        HELM_RELEASE = "devops-app"
        HELM_CHART   = "./HELM/DEVOPS-APP"
        KUBE_NS      = "default"
    }

    stages {

        stage("Checkout") {
            steps {
                checkout scm
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

        stage("Deploy App") {
            steps {
                withCredentials([file(
                    credentialsId: "kubeconfig-secret",
                    variable: "KUBECONFIG_FILE"
                )]) {
                    sh """
                        cp \$KUBECONFIG_FILE /tmp/kubeconfig
                        sed -i 's/127.0.0.1/kubernetes.docker.internal/g' /tmp/kubeconfig
                        export KUBECONFIG=/tmp/kubeconfig
                        helm upgrade --install ${HELM_RELEASE} ${HELM_CHART} \\
                            --namespace ${KUBE_NS} \\
                            --create-namespace \\
                            --set frontend.image.tag=${IMAGE_TAG} \\
                            --set backend.image.tag=${IMAGE_TAG} \\
                            --wait --timeout 5m
                    """
                }
            }
        }

        stage("Deploy Monitoring") {
            steps {
                withCredentials([
                    file(credentialsId: "kubeconfig-secret", variable: "KUBECONFIG_FILE"),
                    string(credentialsId: "grafana-admin-password", variable: "GRAFANA_PASS")
                ]) {
                    sh """
                        cp \$KUBECONFIG_FILE /tmp/kubeconfig
                        sed -i 's/127.0.0.1/kubernetes.docker.internal/g' /tmp/kubeconfig
                        export KUBECONFIG=/tmp/kubeconfig
                        helm repo add prometheus-community https://prometheus-community.github.io/helm-charts || true
                        helm repo update
                        helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \\
                            --namespace monitoring \\
                            --create-namespace \\
                            --set grafana.adminPassword=\$GRAFANA_PASS \\
                            --set grafana.service.type=NodePort \\
                            --set grafana.service.nodePort=32000 \\
                            --wait --timeout 10m
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
            echo "✅ Pipeline complete — Build #${IMAGE_TAG} deployed successfully"
        }
        failure {
            echo "❌ Pipeline failed — check logs above"
        }
    }
}