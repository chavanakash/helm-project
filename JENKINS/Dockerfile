FROM jenkins/jenkins:lts-jdk17

USER root

# Install dependencies
RUN apt-get update && \
    apt-get install -y docker.io curl gnupg

# Install Node.js (LTS)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Install kubectl
RUN curl -LO "https://dl.k8s.io/release/stable/bin/linux/amd64/kubectl" && \
    install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm
RUN curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

USER jenkins