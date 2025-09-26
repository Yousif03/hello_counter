# k8s-hello

A simple microservices app for demonstrating Kubernetes deployment.

## Components

- **Frontend**  
  - Node.js + Express  
  - Provides a web UI at `/hello/<name>`  
  - Calls the Counter service REST API to fetch and display a counter value.  

- **Counter**  
  - Node.js + Express  
  - REST API:  
    - `GET /count/<name>` → increments and returns count for a user  
    - `PUT /count/<name>` → resets count for a user  
  - Persists values in MongoDB.  

- **MongoDB**  
  - Stores user counters with persistent storage (PVC).  

## Features

- Each service runs in its own container (Docker image pushed to Docker Hub).  
- REST APIs between services.  
- Kubernetes deployment with:
  - Namespace isolation  
  - Separate Deployment + Service per microservice  
  - PersistentVolumeClaim for MongoDB data  
  - Horizontal scaling of frontend and counter independently  

## How to Run

```bash
# create namespace
kubectl apply -f k8s/00-namespace.yaml

# deploy MongoDB
kubectl apply -f k8s/10-mongo.yaml

# deploy Counter service
kubectl apply -f k8s/20-counter.yaml

# deploy Frontend
kubectl apply -f k8s/30-frontend.yaml

# forward ports
kubectl -n hello port-forward svc/frontend 8080:3000


# wait for pods to be Ready, then browse:
# Docker Desktop K8s: http://localhost:30080/hello/<name>
# Or port-forward:
kubectl -n hello port-forward svc/frontend 8080:3000
# then go to http://localhost:8080/hello/<name>