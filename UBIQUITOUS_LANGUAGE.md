# Ubiquitous Language: NetSight

This document establishes the official domain terminology for NetSight. All code, database schemas, API contracts, documentation, and user interfaces must strictly adhere to these definitions. Generic developer jargon (e.g., *Manager*, *Handler*, *Util*, *Helper*, *Service*) is excluded in favor of domain-centric vocabulary.

---

## Domain Glossary

| Term | Definition | Aliases to Avoid | Named in Code At |
| :--- | :--- | :--- | :--- |
| **Organization** | The top-level tenant boundary that logically isolates users, monitored networks, agents, devices, alerts, and system settings. | Company, Account, Tenant, Workspace, Group | [backend/models/userModel.js:38](file:///e:/NetSight-main/NetSight-main/backend/models/userModel.js#L38)<br>[backend/models/deviceModel.js:9](file:///e:/NetSight-main/NetSight-main/backend/models/deviceModel.js#L9)<br>[backend/models/settingsModel.js:3](file:///e:/NetSight-main/NetSight-main/backend/models/settingsModel.js#L3) |
| **Device** | A distinct physical or virtual network endpoint (host, server, router, switch, printer) discovered and tracked within an organization's network. | Host, Machine, Node, Box, Endpoint, Item | [backend/models/deviceModel.js:3](file:///e:/NetSight-main/NetSight-main/backend/models/deviceModel.js#L3)<br>[agent/src/services/scanner.js:628](file:///e:/NetSight-main/NetSight-main/agent/src/services/scanner.js#L628)<br>[frontend/src/pages/DevicesPage.tsx:31](file:///e:/NetSight-main/NetSight-main/frontend/src/pages/DevicesPage.tsx#L31) |
| **Agent** | An autonomous local background probe deployed inside a private local area network (LAN) that performs hardware discovery and telemetry collection. | Client, Worker, Daemon, Runner, Collector, Probe | [backend/models/agentModel.js:3](file:///e:/NetSight-main/NetSight-main/backend/models/agentModel.js#L3)<br>[agent/src/index.js:61](file:///e:/NetSight-main/NetSight-main/agent/src/index.js#L61)<br>[agent/src/config.js:11](file:///e:/NetSight-main/NetSight-main/agent/src/config.js#L11) |
| **Agent Key** | A high-entropy cryptographic machine credential generated during onboarding to authenticate an agent's telemetry pushes to the backend. | API Key, Secret, Machine Token, Access Code, Auth Key | [backend/models/agentModel.js:8](file:///e:/NetSight-main/NetSight-main/backend/models/agentModel.js#L8)<br>[backend/middleware/agentMiddleware.js:10](file:///e:/NetSight-main/NetSight-main/backend/middleware/agentMiddleware.js#L10)<br>[frontend/src/pages/SetupWizard.tsx:91](file:///e:/NetSight-main/NetSight-main/frontend/src/pages/SetupWizard.tsx#L91) |
| **Subnet CIDR** | The Classless Inter-Domain Routing notation (e.g., `192.168.1.0/24`) specifying the IP address boundary scanned by the agent. | IP Range, Scan Range, Network Range, Subnet Mask, Address Pool | [agent/src/config.js:12](file:///e:/NetSight-main/NetSight-main/agent/src/config.js#L12)<br>[agent/src/services/scanner.js:561](file:///e:/NetSight-main/NetSight-main/agent/src/services/scanner.js#L561)<br>[backend/controllers/deviceController.js:474](file:///e:/NetSight-main/NetSight-main/backend/controllers/deviceController.js#L474) |
| **Telemetry Metric** | A time-stamped performance observation recording latency, packet loss, bandwidth, CPU load, or memory utilization for a device. | Stat, Ping Measurement, Device Stat, Reading, Metric Data | [backend/models/deviceMetricModel.js:3](file:///e:/NetSight-main/NetSight-main/backend/models/deviceMetricModel.js#L3)<br>[backend/controllers/monitoringController.js:34](file:///e:/NetSight-main/NetSight-main/backend/controllers/monitoringController.js#L34) |
| **Alert** | An active operational incident triggered when a device's telemetry metric violates pre-established health thresholds. | Incident, Issue, Warning, Notification, Alarm, Flag | [backend/models/alertModel.js:3](file:///e:/NetSight-main/NetSight-main/backend/models/alertModel.js#L3)<br>[backend/utils/alertChecker.js:12](file:///e:/NetSight-main/NetSight-main/backend/utils/alertChecker.js#L12)<br>[frontend/src/pages/AlertsPage.tsx:7](file:///e:/NetSight-main/NetSight-main/frontend/src/pages/AlertsPage.tsx#L7) |
| **Alert State** | The lifecycle stage of an alert: `NEW` (detected), `ACKNOWLEDGED` (seen by operator), or `RESOLVED` (recovered). | Status, Condition, Phase, Progress | [backend/models/alertModel.js:33](file:///e:/NetSight-main/NetSight-main/backend/models/alertModel.js#L33)<br>[backend/utils/alertChecker.js:106](file:///e:/NetSight-main/NetSight-main/backend/utils/alertChecker.js#L106) |
| **Health Status** | The live operational condition of a device: `Online` (responding), `Degraded` (high latency / packet drop), or `Offline` (unresponsive). | State, Ping Status, Availability, Alive Flag | [backend/models/deviceModel.js:26](file:///e:/NetSight-main/NetSight-main/backend/models/deviceModel.js#L26)<br>[backend/utils/liveState.js:26](file:///e:/NetSight-main/NetSight-main/backend/utils/liveState.js#L26)<br>[frontend/src/components/StatusBadge.tsx:1](file:///e:/NetSight-main/NetSight-main/frontend/src/components/StatusBadge.tsx#L1) |
| **Network Topology** | The structured relationship graph connecting devices, switches, gateways, and subnets to depict physical and logical LAN links. | Network Map, Node Diagram, Connection Graph, Visual Tree | [frontend/src/pages/TopologyPage.tsx:61](file:///e:/NetSight-main/NetSight-main/frontend/src/pages/TopologyPage.tsx#L61)<br>[frontend/src/utils/topologyGrouping.ts:4](file:///e:/NetSight-main/NetSight-main/frontend/src/utils/topologyGrouping.ts#L4) |
| **Audit Log** | An immutable, tamper-evident chronological record of user actions, administrative configuration updates, and security events. | Activity Log, History, Event Log, System Log, Trail | [backend/models/auditModel.js:3](file:///e:/NetSight-main/NetSight-main/backend/models/auditModel.js#L3)<br>[backend/controllers/auditController.js:7](file:///e:/NetSight-main/NetSight-main/backend/controllers/auditController.js#L7)<br>[frontend/src/pages/AuditLogsPage.tsx:8](file:///e:/NetSight-main/NetSight-main/frontend/src/pages/AuditLogsPage.tsx#L8) |
| **Failure Prediction** | A calculated probability and risk severity score forecasting hardware failure or degradation based on historical metric trends. | Prediction, Forecast, Risk Score, Health Trend, Anomaly Analysis | [frontend/src/pages/FailurePredictionPage.tsx:21](file:///e:/NetSight-main/NetSight-main/frontend/src/pages/FailurePredictionPage.tsx#L21)<br>[frontend/src/pages/DeviceAnalysisPage.tsx:44](file:///e:/NetSight-main/NetSight-main/frontend/src/pages/DeviceAnalysisPage.tsx#L44) |

---

## Flagged Ambiguities

### Two Words Meaning One Thing

1. **`Device` vs. `Host`**
   - **Ambiguity:** `scanner.js` and ping sweeps refer to target IPs as `host`, while database schemas (`deviceModel.js`) and dashboards refer to `device`.
   - **Winner:** **`Device`** wins. A `host` merely denotes an IP address, whereas a `Device` represents an enriched entity containing MAC address, hardware vendor, open ports, OS fingerprint, and historical telemetry.

2. **`Agent Key` vs. `API Key`**
   - **Ambiguity:** Setup UI documentation previously referred to "Agent API Key", while backend database models (`agentModel.js:8`) and headers (`agentMiddleware.js:10`) use `agentKey` / `x-agent-key`.
   - **Winner:** **`Agent Key`** wins. "API Key" implies an interactive developer credential with user permissions. "Agent Key" explicitly designates machine-to-machine authentication between the autonomous probe and backend.

3. **`Alert` vs. `Notification`**
   - **Ambiguity:** In `backend/utils/sendEmail.js` and emergency dispatchers, offline alerts are called "Email Notifications", whereas the incident management system uses `Alert`.
   - **Winner:** **`Alert`** wins. The domain entity is an `Alert`. A notification is simply an external transport mechanism (email/webhook) through which an alert is communicated.

---

### One Word Meaning Two Things

1. **`Agent`**
   - **Ambiguity:** In `agent/src/index.js`, `Agent` refers to the on-premise daemon running inside the customer's private LAN. In `backend/services/monitoringAgent.js`, the word was also used to describe a server-side background cron worker pinging cloud targets.
   - **Winner:** **`Agent`** exclusively means the on-premise local discovery probe. The server-side background routine is renamed and disambiguated as **`Telemetry Worker`**.

2. **`Status`**
   - **Ambiguity:** `deviceModel.js:26` uses `status` to describe whether a physical device is `Online`, `Degraded`, or `Offline`. Simultaneously, `alertModel.js:33` uses `status` to represent alert lifecycle progress (`NEW`, `ACKNOWLEDGED`, `RESOLVED`).
   - **Winner:** Disambiguated into two distinct terms:
     - **`Health Status`** for the physical connectivity state of a **Device**.
     - **`Alert State`** for the workflow lifecycle of an **Alert**.
