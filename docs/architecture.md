Architecture
1) Overview
Browser
  │  GET /hello/:name
  ▼
Frontend (Node/Express)
  │  calls: GET /count/:name , PUT /count/:name
  ▼
Counter (Node/Express)
  │  MongoDB driver over TCP
  ▼
MongoDB (StatefulSet + PVC)


Goal: show a minimal, horizontally scalable microservice system with a persistent database, deployable to Kubernetes, accessible from a browser.

Stateless vs stateful: frontend and counter are stateless (safe to scale/replace); mongo is stateful (uses persistent storage).


**Goal:** show a minimal, horizontally scalable microservice system with a persistent database, deployable to Kubernetes, accessible from a browser.  
**Stateless vs stateful:** `frontend` and `counter` are stateless (safe to scale/replace); `mongo` is stateful (uses persistent storage).

---

## 2) Components & Responsibilities

### 2.1 Frontend (microservice)
- **Responsibility:** Present a tiny UI and act as API gateway to `counter`.
- **Tech:** Node.js + Express.
- **Endpoint:** `GET /hello/:name` → calls Counter → renders “Hello <name>, you visited N times.”
- **Config:** `COUNTER_URL` (default `http://counter:3000`)
- **Scaling:** independent `Deployment` with replicas; exposed via `Service` **NodePort** (30080) for outside access.

### 2.2 Counter (microservice)
- **Responsibility:** Maintain per-name counters in MongoDB.
- **Tech:** Node.js + Express, Mongoose.
- **REST API:**
  - `GET /count/:name` → increments and returns `{ name, count }`
  - `PUT /count/:name` → resets to zero and returns `{ name, count: 0 }`
- **Config:** `MONGO_URL` (default `mongodb://mongo:27017/helloapp`)
- **Scaling:** independent `Deployment` with replicas; internal `Service` (ClusterIP).

### 2.3 MongoDB (database)
- **Responsibility:** Persistent storage for counters.
- **Tech:** MongoDB (single-replica `StatefulSet` with `PersistentVolumeClaim`).
- **Data model:** `db.visits` documents `{ _id, name, count }`.
- **Access:** internal `Service` (ClusterIP). No external exposure.

---

## 3) Kubernetes Design

### 3.1 Resources (namespace `hello`)
- `00-namespace.yaml` → `Namespace/hello`
- `10-mongo.yaml` → `StatefulSet/mongo` + `Service/mongo` + `PVC`
- `20-counter.yaml` → `Deployment/counter` + `Service/counter` (ClusterIP)
- `30-frontend.yaml` → `Deployment/frontend` + `Service/frontend` (**NodePort 30080**)

### 3.2 Service Discovery
- Frontend → Counter: `http://counter.hello.svc.cluster.local:3000`
- Counter → Mongo: `mongodb://mongo.hello.svc.cluster.local:27017/helloapp`

### 3.3 Horizontal Scaling
- `kubectl -n hello scale deploy/frontend --replicas=3`
- `kubectl -n hello scale deploy/counter  --replicas=4`  
Stateless services are interchangeable; Mongo holds state.

### 3.4 Persistence
Mongo uses a **PVC** (e.g., 1Gi, `ReadWriteOnce`). Data survives pod restarts and redeploys.

---

## 4) Runtime Flow

**First visit**
1. User opens `/hello/:name` on Frontend (e.g., `/hello/Ahmed`).
2. Frontend calls Counter `GET /count/:name` (e.g., `GET /count/Ahmed`).
3. Counter upserts `{ name: '<name>' }` and increments `count` in MongoDB.
4. Counter returns `{ name: '<name>', count: N }`.
5. Frontend renders the page with the current count for that name.

**Reset**
1. Client (or script) calls `PUT /count/Yousif`.
2. Counter sets `count=0` and returns `{name:'Yousif', count:0}`.

---

## 5) Cloud Architecture Patterns

- **Horizontally Scaling Compute** (scale stateless services).
- **Gateway / BFF** (Frontend as user-facing gateway).
- **Database per service (simplified)** for demo.
- **Infrastructure as Code** (`k8s/` manifests).
- **Health via rollouts** (`kubectl rollout status`).

---

## 6) Benefits & Challenges

### Benefits
- Simple, clear boundaries.
- Independent scaling of Frontend and Counter.
- Resilient stateless services.
- Portable (Docker Desktop K8s / cloud).

### Challenges & mitigations
- **Mongo auth disabled (demo):** enable `--auth`, create users, store creds in **Secrets**, restrict with **NetworkPolicies**.
- **No TLS at edge:** use **Ingress + TLS** (cert-manager) instead of NodePort.
- **Startup ordering:** add readiness probes and retry backoff in Counter.
- **Single Mongo replica:** use a **ReplicaSet** (3 nodes) for HA in prod.
- **Limited observability:** add `/healthz`, structured logs, metrics (Prometheus/Grafana).
- **Image trust:** pin bases, scan images, sign (cosign).

---

## 7) Configuration

| Service  | Env var       | Purpose                         | Default                                                     |
|----------|---------------|----------------------------------|-------------------------------------------------------------|
| frontend | `COUNTER_URL` | Base URL to Counter REST API     | `http://counter.hello.svc.cluster.local:3000`              |
| counter  | `MONGO_URL`   | Mongo connection string          | `mongodb://mongo.hello.svc.cluster.local:27017/helloapp`   |
| both     | `PORT`        | Container listen port            | `3000`                                                      |

> Set under `spec.template.spec.containers[].env` in the YAML.

---

## 8) Deployment Mapping

| Component | K8s Kind   | Name       | Notes                                          |
|-----------|------------|------------|------------------------------------------------|
| Namespace | Namespace  | `hello`    | isolates resources                             |
| Mongo     | StatefulSet| `mongo`    | 1 replica + PVC                                |
| Mongo     | Service    | `mongo`    | ClusterIP for in-cluster access                |
| Counter   | Deployment | `counter`  | 2 replicas (scalable)                          |
| Counter   | Service    | `counter`  | ClusterIP                                      |
| Frontend  | Deployment | `frontend` | 2 replicas (scalable)                          |
| Frontend  | Service    | `frontend` | NodePort 30080 for browser access              |

---

## 9) Assignment Fit

- Deployable with Kubernetes.
- ≥2 microservices + a database.
- REST APIs between services.
- Accessible from outside (NodePort).
- Independent horizontal scaling.
- Images pushed to Docker Hub.
- Persistent storage for DB.
- DB not required to scale.

---

## 10) Future Work
- Add a tiny HTML form in Frontend (name input + Reset button).
- Replace NodePort with Ingress + TLS.
- Add liveness/readiness probes.
- CI/CD (GitHub Actions) to build/push/apply.
