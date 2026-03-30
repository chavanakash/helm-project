pipeline {
  agent any

  environment {
    DOCKER_USER  = "dockerizzz"
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
            sh "docker build -t ${DOCKER_USER}/frontend:${IMAGE_TAG} -t ${DOCKER_USER}/frontend:latest ./FRONTEND"
          }
        }
        stage("Backend") {
          steps {
            sh "docker build -t ${DOCKER_USER}/backend:${IMAGE_TAG} -t ${DOCKER_USER}/backend:latest ./BACKEND"
          }
        }
      }
    }

    stage("Test") {
      steps {
        dir("BACKEND") {
          sh "npm ci"
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
          sh '''
            echo $DOCKER_PASS | docker login -u $DOCKER_USER_LOGIN --password-stdin
            docker push ${DOCKER_USER}/frontend:${IMAGE_TAG}
            docker push ${DOCKER_USER}/frontend:latest
            docker push ${DOCKER_USER}/backend:${IMAGE_TAG}
            docker push ${DOCKER_USER}/backend:latest
          '''
        }
      }
    }

    stage("Deploy App") {
      steps {
        withCredentials([file(credentialsId: "kubeconfig-secret", variable: "KUBECONFIG")]) {
          sh '''
            export KUBECONFIG=$KUBECONFIG
            helm upgrade --install ${HELM_RELEASE} ${HELM_CHART} \
              --namespace ${KUBE_NS} \
              --create-namespace \
              --set frontend.image.tag=${IMAGE_TAG} \
              --set backend.image.tag=${IMAGE_TAG} \
              --wait --timeout 5m
          '''
        }
      }
    }

    stage("Deploy Monitoring") {
      steps {
        withCredentials([file(credentialsId: "kubeconfig-secret", variable: "KUBECONFIG")]) {
          sh '''
            export KUBECONFIG=$KUBECONFIG
            helm repo add prometheus-community https://prometheus-community.github.io/helm-charts || true
            helm repo update
            helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \
              --namespace monitoring \
              --create-namespace \
              --set grafana.adminPassword=admin123 \
              --set grafana.service.type=NodePort \
              --set grafana.service.nodePort=32000 \
              --wait --timeout 10m
          '''
        }
      }
    }
  }

  post {
    always  { sh "docker logout || true" }
    success { echo "Pipeline complete — Build #${IMAGE_TAG} deployed" }
    failure { echo "Pipeline failed — check logs above" }
  }
}