# NetSight

> Real-time network observability, device discovery, topology visualization, and proactive failure analytics platform.

---

## Live URL

- **Production Web Dashboard:** [https://netsight-mu.vercel.app](https://netsight-mu.vercel.app)
- **Custom Domain:** [https://netsight.online](https://netsight.online)
- **Backend API Service:** [https://net-sight-tbd4.vercel.app/api/v1](https://net-sight-tbd4.vercel.app/api/v1)

---

## How to Run It Locally, in ≤ 5 Commands

Follow these 5 commands to run the entire NetSight platform locally:

```bash
# 1. Clone repository
git clone https://github.com/kenildhola010/NetSight-.git && cd NetSight-

# 2. Install all dependencies for backend and frontend
npm --prefix backend install && npm --prefix frontend install

# 3. Configure environment variables (uses local MongoDB fallback)
echo "PORT=5000\nMONGO_URI=mongodb://localhost:27017/netsight\nJWT_SECRET=netsight_secret_key" > backend/.env

# 4. Start the backend API server (runs on http://localhost:5000)
npm --prefix backend run dev

# 5. Start the frontend client (opens http://localhost:3000)
npm --prefix frontend start
```

*(Optional: To run the on-premise network discovery agent: `cd agent && npm install && npm start` — opens agent UI at `http://localhost:9090`)*

---

## Platform Overview

NetSight solves the fundamental challenge where cloud observability platforms cannot directly inspect or monitor devices inside private local area networks (LANs).

The architecture consists of three core components:

```text
                      +----------------------+
                      |   React Frontend     |
                      |   localhost:3000     |
                      +----------+-----------+
                                 |
                                 | REST + Socket.IO
                                 v
                      +----------------------+
                      |   Node/Express API   |
                      |   localhost:5000     |
                      +----------+-----------+
                                 |
                                 | MongoDB
                                 v
                      +----------------------+
                      |      MongoDB         |
                      +----------------------+
                                 ^
                                 |
                     HTTP + WebSocket + Agent Key Auth
                                 |
                      +----------+-----------+
                      |   NetSight Agent     |
                      |   localhost:9090 UI  |
                      +----------------------+
```

1. **`agent/` (Local Discovery Probe):** Sits inside the private LAN. Performs ARP scanning, ICMP sweeps, TCP port probing, and SNMP inspection, then pushes telemetry to the backend using secure machine-to-machine authentication (`X-Agent-Key`).
2. **`backend/` (Core API & Engine):** Node.js, Express, and MongoDB. Stores device models, ingests telemetry metrics, computes alert deduplication, tracks live state in memory, and pushes real-time WebSocket events.
3. **`frontend/` (Control Room UI):** React, TypeScript, and Tailwind CSS dashboard showing interactive 2D/3D topology graphs, device inventories, failure predictions, alert incident response, and audit trails.

---

## Key Features

- **Multi-Tenant Organization Management:** Scoped tenant isolation for users, devices, alerts, and agents.
- **Automated Network Discovery:** Hybrid ARP cache scanning, ICMP ping sweep, and OUI MAC vendor resolution.
- **Continuous Health Telemetry:** Sub-second latency, packet loss, and availability tracking.
- **Enterprise Alert Deduplication:** Windowed alert suppression preventing incident storming.
- **Interactive Topology Visualization:** Dynamic grouping and canvas mapping of LAN nodes and gateways.
- **Audit Logging:** Immutable audit logs of all configuration, user access, and network actions.
- **Pre-packaged Windows Executable:** Standalone agent binary available directly from the Setup Wizard.

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Radix UI Primitives, Lucide Icons, Socket.IO Client.
- **Backend:** Node.js, Express.js, MongoDB, Mongoose, Socket.IO, JWT, bcryptjs, Nodemailer.
- **Agent:** Node.js daemon, native child processes (`arp`, `ping`), TCP socket probing (`net`), SNMP.
