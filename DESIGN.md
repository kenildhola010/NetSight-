# System Design: NetSight

All concepts and rules in this document strictly enforce the domain vocabulary established in [UBIQUITOUS_LANGUAGE.md](file:///e:/NetSight-main/NetSight-main/UBIQUITOUS_LANGUAGE.md).

---

## Five Core Product Rules

1. **Machine Telemetry Ingestion Requires a Valid Agent Key**  
   An **Agent** pushing discovered **Device** records or streaming **Telemetry Metric** observations must authenticate with a valid **Agent Key** assigned to a registered **Organization**. Requests lacking a valid key are rejected immediately with HTTP 401 Unauthorized.

2. **Strict Multi-Tenant Isolation by Organization**  
   Every **Device**, **Telemetry Metric**, **Alert**, and **Audit Log** is bound to an **Organization**. Users and **Agents** can only query or mutate resources matching their verified organization context; cross-organization access is strictly prohibited at the database query level.

3. **Windowed Alert Deduplication**  
   When a **Device** metric violates a health threshold, a new **Alert** is generated only if no active **Alert** (in **Alert State** `NEW` or `ACKNOWLEDGED`) exists for that specific **Device** and metric. Successive violations increment the duplicate counter and update the metric value without inserting redundant database rows.

4. **Role-Based Administrative Control**  
   Only users possessing the `admin` role within an **Organization** are authorized to alter **Subnet CIDR** scanning boundaries, generate new **Agent Keys**, or manage user access permissions. Operator and viewer roles can inspect **Network Topology** and **Device** health, but cannot mutate operational parameters.

5. **Deterministic Device Health Status Transitions**  
   A **Device** transitions between **Health Status** values based on active telemetry: it is marked `Online` when responding within threshold latency, `Degraded` when packet loss or latency crosses warning thresholds, and `Offline` when heartbeats fail consecutively, automatically creating an availability **Alert**.

---

## Three Architectural Design Decisions

### 1. Separation of Machine Authentication from User Session Authentication
- **Principle Applied:** Single Responsibility Principle (SOLID - SRP) and Boundary Isolation.
- **Location in Code:** [backend/middleware/agentMiddleware.js:9-44](file:///e:/NetSight-main/NetSight-main/backend/middleware/agentMiddleware.js#L9-L44) vs. [backend/middleware/authMiddleware.js:5-34](file:///e:/NetSight-main/NetSight-main/backend/middleware/authMiddleware.js#L5-L34)
- **Before and Why Changed:**  
  Previously, the on-premise **Agent** attempted to authenticate by submitting username and password to `/api/v1/auth/login` to obtain a standard user JWT token.  
  *Why changed:* User JWT tokens expire after short durations and require interactive user re-login, which caused unattended background **Agent** probes to silently stop submitting telemetry. Furthermore, storing human user credentials in plaintext agent configuration files created an unacceptable credential leak risk. We introduced a dedicated machine authentication mechanism using a persistent, bcrypt-hashed **Agent Key** transmitted via the `X-Agent-Key` header, decoupling autonomous machine telemetry from interactive user sessions.

### 2. State-Aware Alert Deduplication with Throttled Broadcasting
- **Principle Applied:** Open/Closed Principle (SOLID - OCP) and Common Closure Principle (CCP).
- **Location in Code:** [backend/utils/alertChecker.js:101-131](file:///e:/NetSight-main/NetSight-main/backend/utils/alertChecker.js#L101-L131)
- **Before and Why Changed:**  
  Previously, every 5-second polling cycle that measured high latency or an unreachable ping executed an unconditional `Alert.create()` write to MongoDB and broadcast an immediate WebSocket event to the frontend.  
  *Why changed:* During brief network hiccups or flapping connections, thousands of redundant alerts flooded the database within minutes, overwhelming database storage and inducing browser freezing due to event thrashing. We refactored the evaluation logic to check for active **Alert State** (`NEW` or `ACKNOWLEDGED`), increment `duplicate_count`, update the latest metric timestamp, and throttle WebSocket notifications to every 5th duplicate event.

### 3. Decoupled In-Memory Live State Tracking from Persistent Telemetry Storage
- **Principle Applied:** Dependency Inversion Principle (SOLID - DIP) and Architectural Boundary Separation.
- **Location in Code:** [backend/utils/liveState.js:8-48](file:///e:/NetSight-main/NetSight-main/backend/utils/liveState.js#L8-L48)
- **Before and Why Changed:**  
  Previously, every continuous probe cycle directly executed synchronous `Device.findByIdAndUpdate()` and `DeviceMetric.create()` database operations for every monitored **Device** on the network.  
  *Why changed:* On subnets with 50+ devices, this generated over 600 database writes per minute, causing connection pool exhaustion and disk write thrashing. We introduced an in-memory live state registry that maintains transient **Health Status** and real-time latency in memory for instant WebSocket broadcasting, reserving MongoDB writes for significant state transitions and throttled historical metric rollups.

---

## Architectural Boundary

### The Local Network Probe Boundary
- **Where Core Logic Stops and the Outside World Begins:**  
  NetSight's core business logic (device inventory models, telemetry aggregation, topology graphing, and alert threshold calculation) operates strictly on validated, high-level JSON domain structures. Core logic stops at the operating system subprocess and raw socket boundary inside [agent/src/services/scanner.js:40-120](file:///e:/NetSight-main/NetSight-main/agent/src/services/scanner.js#L40-L120).
- **Which Dependency It Protects You From:**  
  This boundary isolates NetSight from direct dependencies on underlying operating system network utilities (`arp`, `ping`, `ipconfig`, `snmpget`), disparate platform command syntax (Windows flags vs. Linux flags), variable terminal string outputs, raw ICMP protocol sockets, and physical Ethernet/Wi-Fi interface fluctuations. The **Agent** absorbs and normalizes all OS-level hardware anomalies, presenting only clean, uniform telemetry to the backend API.

---

## AI Collaboration & Governance

- **Tools Used and Scope:**
  - **Claude / Gemini LLM Models:** Used for scaffolding accessible Radix UI component wrappers and TypeScript typing definitions in `frontend/src/components/ui/`, ensuring clean integration with Tailwind CSS design tokens.
  - **AI Regex Generator:** Used for constructing robust cross-platform regular expressions to parse multiline ARP table text dumps across Windows dynamic/static entries and Linux neighbor tables in `agent/src/services/scanner.js`.

- **Rejected AI Suggestion and Rationale:**
  - *Suggestion:* The AI suggested integrating the `net-ping` npm package (using C++ native bindings) to inject raw ICMP socket packets directly from the Node.js event loop for faster ping sweeps.
  - *Why Rejected:* Binding raw ICMP sockets requires administrator/root OS privileges, fails in standard user containers, requires heavyweight `node-gyp` and Visual Studio build toolchains during installation, and breaks compilation when bundling the standalone Windows executable (`netsight-agent.exe`). We rejected raw sockets in favor of invoking platform-native CLI ping commands and asynchronous TCP socket connections (`net.connect`), preserving zero-dependency portability on client machines without requiring root elevation.
