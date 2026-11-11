# Defense Presentation Script (20 Slides – 5 Presenters)

**Project Title:** Design and Implementation of a Smart Web-Based Queuing Management System with Mobile Tracking and Statistical Reporting for the BPL-LIEO of LGU, Rosario, La Union  
**Total Slides:** 20 Slides (4 Slides per Presenter)

---

## Presenter Distribution Overview

| Presenter | Assigned Slides | Focus Area |
| :--- | :--- | :--- |
| **Presenter 1** (*Rojean F. Tandas*) | **Slides 1 – 4** | Title, Problem Context, Proposed Solution, & 5 Core Modules |
| **Presenter 2** (*Manrijan M. Barbosa*) | **Slides 5 – 8** | Users & Evaluators, Scope Limits, Agile SDLC Overview, & Plan/Design |
| **Presenter 3** (*Carren Nicole A. Estrelles*) | **Slides 9 – 12** | Tech Stack, 4 Testing Deliverables, Smart Score $S(t)$, & Phantom Wait $E[W]$ |
| **Presenter 4** (*John David R. Garcia*) | **Slides 13 – 16** | **System Models (Part 1):** Figure 1 (DFD 0), Figure 2 (DFD 1), Figure 3 (ERD), & Figure 4 (Use-Case) |
| **Presenter 5** (*Jade Allysa V. Rulloda*) | **Slides 17 – 20** | **System Models (Part 2):** Figure 5 (Swimlane), Figure 6 (Engine Activity), Figure 7 (BPMN 2.0), Figure 8 (As-Is vs. To-Be), & Closing |

*(Note: You can swap names across Presenter 1–5 however your group prefers!)*

---

## 🎤 PRESENTER 1 (Slides 1 – 4): Overview, Problem, Solution, & Core Modules

### Slide 1: A Smart Web-Based Queuing System for BPL-LIEO, Rosario, La Union
> "Good day to our esteemed panel members and adviser, Prof. Emely A. Munar. We are Rojean Tandas, Manrijan Barbosa, Carren Nicole Estrelles, John David Garcia, and Jade Allysa Rulloda. Today, we are proud to present our thesis project titled: **Design and Implementation of a Smart Web-Based Queuing Management System with Mobile Tracking and Statistical Reporting for the BPL-LIEO of LGU, Rosario, La Union**."

### Slide 2: Project Overview — Crowded waiting rooms. Missed turns.
> "To begin, let us look at the operational reality at the Business Permits, Licensing - Local Investment and Enterprise Office, or **BPL-LIEO**, in Rosario, La Union. Every day—especially during peak business registration and renewal periods—the office handles a heavy influx of citizens across three distinct transactions: **New Business Applications**, **Permit Renewals**, and **Business Retirements or Closures**.
>
> Right now, relying on manual or localized queuing creates two major bottlenecks:
> 1. **First, Manual Queuing:** Waiting areas become overcrowded, waiting times are uncertain, and frontline staff are pressured to manually balance different transaction categories and priority groups.
> 2. **Second, Clients Step Away:** While the Anti-Red Tape Authority's **eBOSS** platform digitizes permit records and payments, it does not manage the physical waiting experience inside the municipal hall. When citizens step outside to get a document or some air, they miss verbal calls—leading to 'no-shows,' skipped numbers, and 'return-tomorrow' delays."

### Slide 3: The Solution — Five capabilities that free clients from the waiting room
> "To bridge this gap, our system introduces a communicative, hybrid local-and-cloud queuing solution built around **five core capabilities**:
> 1. **QR-Code Tickets:** Issues unique, date-and-category-prefixed tickets (`NW`, `RNW`, and `R`) embedded with a scannable QR code.
> 2. **Mobile Tracking & Multi-Channel Alerts:** Frees citizens from the waiting room by letting them track their live rank on their smartphone and receive automated **Vonage SMS** and **Web Push** alerts when they are two spots away, when called, and when recalled.
> 3. **Smart Auto-Balancing & Priority Engine:** Replaces rigid First-In-First-Out queuing with our dynamic **Smart Score $S(t)$**, **Peace and Crunch Mode** counter balancing, and **Phantom Queue wait-time prediction**.
> 4. **Staff Dashboard & Public TV Monitor:** Synchronizes counter actions instantaneously over LAN WebSockets with a Smart TV display featuring voice call synthesis and audio chimes.
> 5. **Statistical Reporting & SLA Analytics:** Captures every transaction to generate Service Level Agreement adherence and Year-over-Year analytics."

### Slide 4: Project Scope — Five core modules
> "Our in-scope development for School Year 2026–2027 is organized into **five core software modules**:
> 1. The **Ticket Generator Module**, which handles transaction selection, priority classification, atomic daily sequence numbering, and thermal QR printing.
> 2. The **Smart Queue Engine and Staff Dashboard**, which powers role-based counter operations—*Call Next, Recall, Complete, Postpone,* and *No-Show*—and continuous queue sorting.
> 3. The **Real-Time Public Monitor Display**, which broadcasts active windows, waiting queues, voice announcements, and advisories.
> 4. The **Mobile Client Tracker and Notifications Module**, which syncs live ticket states to the cloud for remote QR tracking and SMS/Web Push alerts.
> 5. And the **Admin Reporting, Settings, and Audit Module**, which provides interactive charts, configurable SLA rules, and tamper-evident audit logs.
>
> I will now pass the floor to **Presenter 2** to discuss our target evaluators, scope limits, and development methodology."

---

## 🎤 PRESENTER 2 (Slides 5 – 8): Evaluators, Scope Limits, & Agile Methodology

### Slide 5: Users and Evaluators — Who uses it and who evaluates it
> "Thank you. Moving to Slide 5, our system is evaluated against the **ISO/IEC 25010 Software Quality Model** by **62 total respondents** across three groups:
> - **10 BPL-LIEO Frontline Staff and Administrators** via *Total Enumeration*, who operate the ticket terminal, counter dashboard, settings, and reporting modules.
> - **50 Visiting Citizens and Clients** selected via *Convenience Sampling* from an estimated 150 daily clients, who evaluate the QR ticket, public monitor, mobile tracker, and SMS/Web Push notifications.
> - And **2 IT Experts** via *Purposive Sampling*, who assess the technical implementation, focusing on security, maintainability, portability, and compatibility."

### Slide 6: Scope Limits — Queue orchestration, not permit processing
> "On Slide 6, we establish our clear project delimitations:
> - First, **our system focuses strictly on queue orchestration, not permit processing.** Tax assessment, regulatory document verification, and online fee collection belong to the **eBOSS** platform, whereas our system orchestrates the physical and virtual client flow inside the municipal hall.
> - Second, the workflow, service categories, and counter rules are tailored specifically to the **BPL-LIEO of LGU Rosario, La Union**.
> - Third, while remote SMS delivery relies on cellular carriers via Vonage and mobile tracking relies on internet sync with Firebase Firestore, **all local counter and public TV operations continue 100% uninterrupted over the Local Area Network via SQLite** even during internet outages."

### Slide 7: Methodology — Agile SDLC, built in iterative sprints
> "To build this system, we adopted the **Agile Software Development Life Cycle (SDLC)** structured into five iterative phases: **01 Plan, 02 Design, 03 Develop, 04 Test, and 05 Deploy and Review**. Agile sprints allowed us to continuously integrate feedback from BPL-LIEO personnel while rigorously testing real-time WebSocket and cloud synchronization."

### Slide 8: Plan and Design — Interviews first, then models
> "During **Phase 1 (Plan)**, we conducted formal interviews and workflow observations with the BPL-LIEO Officer-in-Charge and staff, identifying the four core bottlenecks: peak crowding, manual balancing of New, Renewal, and Retirement queues, client no-shows, and return-tomorrow handling.
>
> During **Phase 2 (Design)**, we translated these requirements into our architectural and behavioral models—specifically our **DFDs, Entity-Relationship Diagram, UML Use-Case Diagram, Swimlane and Algorithmic Activity Diagrams, BPMN 2.0 Models, and UI Wireframes**.
>
> **Presenter 3** will now walk us through our Development stack, Testing deliverables, and Mathematical Queuing Models."

---

## 🎤 PRESENTER 3 (Slides 9 – 12): Development, Testing, & Mathematical Models

### Slide 9: Develop — React front end. Node and TypeScript back end. Hybrid data.
> "Thank you. On Slide 9, during **Phase 3 (Develop)**, we engineered a modern, decoupled full-stack architecture:
> - **Front End:** Built as a fast Single-Page Application using **React 18 and Vite**, styled with **Tailwind CSS**, **Recharts** for SLA analytics, and **React Query** for state synchronization.
> - **Back End:** Powered by **Node.js, Express, and TypeScript**, hardened with **JWT authentication, bcrypt password hashing, Helmet security headers, rate limiting, Zod validation**, and documented via **Swagger UI**.
> - **Hybrid Data Layer:** Uses **Prisma ORM with SQLite in Write-Ahead Logging (WAL) mode** for zero-latency local persistence, paired with non-blocking cloud synchronization to **Firebase Cloud Firestore** and automated daily cron backups.
> - **Real-Time & Notifications:** Combines **Socket.io** for sub-second LAN broadcasting with the **Vonage Server SDK** for SMS and **VAPID Web Push** for browser notifications."

### Slide 10: Test — Four formal deliverables
> "In **Phase 4 (Test)**, alongside automated unit, integration, and stress testing with **Jest, Supertest, and Vitest**, our study produces **four formal testing deliverables**:
> 1. **An Alpha/Beta Pass-Fail Matrix** evaluating every core module against expected outputs.
> 2. **A Defect Resolution and System Improvements Report** documenting bugs found during sprint testing and the code optimizations applied.
> 3. **Sync Latency and 0% Data Loss Verification**, measuring the millisecond latency between a staff member clicking *'Call Next'* and the TV updating, and cross-checking SQLite against Firestore during internet drops.
> 4. **Wait-Time Accuracy Analysis**, evaluating our Phantom Queue algorithm using **Mean Absolute Error (MAE)** by comparing predicted wait times against actual wait times."

### Slide 11: Requirement 1 — The Smart Score ranks every waiting ticket
> "Slide 11 presents the heart of our Smart Queue Engine: the **Adaptive Auto-Balancing Formula**, or **Smart Score $S(t)$**:
> $$S(t) = P_{\text{base}} + (W_{\text{mins}} \times R_{\text{aging}}) + P_{\text{SLA}} + P_{\text{skip}} + P_{\text{zipper}}$$
> Instead of rigid FIFO, where regular citizens can be starved indefinitely by incoming priority clients, every waiting ticket is continuously scored using five components:
> - **$P_{\text{base}}$:** The base weight for Priority groups (*PWD, Senior Citizen, Pregnant, Returning*) vs. Regular clients ($0$).
> - **Aging ($W_{\text{mins}} \times R_{\text{aging}}$):** Regular tickets gain $0.1\text{ points per minute}$ waited so they naturally rise over time.
> - **SLA Panic Bonus ($+100$):** Triggered when a ticket's wait time reaches the 15-minute SLA threshold.
> - **Stoplight Skip Limit ($+500$):** Triggered when a ticket has been bypassed 5 times.
> - **Zipper Force Bonus ($+1000$):** Applied to the oldest Regular ticket whenever 3 consecutive priority clients have been served in a row—guaranteeing zero queue starvation."

### Slide 12: Requirement 2 — Phantom Simulation predicts the wait
> "Slide 12 shows our second mathematical model: **Predictive Wait Time via Phantom Simulation ($E[W]$)**.
> When a ticket is generated or updated, the engine injects a virtual 'phantom ticket' into the live queue to find its **true rank ($R_{\text{true}}$)** under $S(t)$.
> Next, it applies a human **Abandonment Discount ($D$)** of $5\%$ for every 10 clients ahead, capped at $30\%$, and divides by the number of **actively manned counters ($C$)** multiplied by the **rolling average service time ($T_{\text{avg}}$)**.
>
> Now, to present the most important part of our specification—our **System Architecture and Design Models**—I turn the floor over to **Presenter 4**."

---

## 🎤 PRESENTER 4 (Slides 13 – 16): System Models Part 1 (Figures 1 – 4)

### Slide 13: Figure 1 · DFD Level 0 — The system and its four outside parties
> "Thank you. Let us now examine our **System Architecture and Design Models**, starting on Slide 13 with **Figure 1: Context-Level Data Flow Diagram (DFD Level 0)**.
>
> Here, the entire application is represented at the center as **Process 0: BPL-LIEO Smart Web-Based Queuing Management System**, interacting with **four external entities** positioned at the four corners:
> 1. **Client / Citizen (top-left):** Submits two inputs—*Transaction Type & Priority* at the kiosk and *QR Scan & SMS/Push Opt-In* on their phone—and receives three outputs: the *Printed QR Ticket & Initial $E[W]$*, the *Public Monitor Broadcast*, and the *Mobile Tracker View & Web Push Alert*.
> 2. **BPL-LIEO Frontline Staff (bottom-left):** Submits *Login & Queue Controls (Call, Recall, Postpone, No-Show, Done)* and receives live *Active Queue & Counter Status*.
> 3. **Vonage SMS Gateway (middle-right):** Receives the *SMS Dispatch Payload (Phone Number & Turn Alert)* and returns the *SMS Delivery Status* receipt.
> 4. **BPL-LIEO Administrator (bottom-right):** Submits *User/Counter Config, Priority Weights & SLA Settings* and receives *Statistical Reports, SLA Analytics, YoY Trends & Audit Logs*."

### Slide 14: Figure 2 · DFD Level 1 — The system breaks into five processes
> "On Slide 14, **Figure 2: DFD Level 1** decomposes Process 0 into **five internal processes (`1.0` to `5.0`)** and **four persistent data stores (`D1` to `D4`)**, while maintaining **strict 1-to-1 external flow balancing** with Level 0:
> - **Process 1.0 (Generate Queue Ticket & QR Code):** Takes the citizen's transaction and priority input, writes the atomic sequence to **D1 (Tickets & Daily Sequence Store in SQLite)**, requests initial wait simulation from Process 2.0, and prints the QR ticket.
> - **Process 2.0 (Compute Smart Score $S(t)$, Predict Wait Time $E[W]$ & Auto-Balance Counters):** Reads waiting tickets from **D1** and rules from **D2 (Users, Counters & Settings Store)**, and feeds the sorted queue and true rank $R_{\text{true}}$ to Processes 3.0 and 4.0.
> - **Process 3.0 (Manage Counter Queue Operations & Broadcast Public Monitor Display):** Executes frontline staff commands, updates ticket statuses in **D1**, logs immutable audit entries into **D3 (Queue Audit & History Store)**, broadcasts to the Public TV, and triggers alerts in Process 4.0.
> - **Process 4.0 (Track Mobile Ticket & Dispatch Multi-Channel Notifications):** Syncs live ticket states with **D4 (Cloud Firestore Store)**, serves the mobile tracker and Web Push alerts to citizens, and exchanges SMS payloads and delivery statuses with the **Vonage SMS Gateway**.
> - **Process 5.0 (Manage Settings, Users & Generate Statistical / SLA Reports):** Allows the Administrator to update configurations in **D2** and **D4**, and aggregates historical records from **D1** and **D3** into SLA and Year-over-Year reports."

### Slide 15: Figure 3 · ERD — Eight tables for sequencing, balancing, and audit
> "Slide 15 shows **Figure 3: Entity-Relationship Diagram (ERD)** in Crow's Foot notation, modeling our **eight SQLite (WAL) tables** managed via Prisma ORM:
> 1. **`Service` (top-left):** Stores the three BPL-LIEO transaction types (`NW`, `RNW`, `R`).
> 2. **`TicketCounter` (middle-left):** Has a one-to-many relationship with `Service` using a composite primary key (`serviceId` + `date` `MMDDYY`) to guarantee atomic daily sequence numbering with zero duplicate tickets.
> 3. **`PriorityGroup` (bottom-left):** Defines configurable priority weights and SLA thresholds linked logically to `Ticket`.
> 4. **`Ticket` (center):** The core transactional table storing ticket number, status (`WAITING`, `SERVING`, `COMPLETED`, `POSTPONED`, `NO_SHOW`), `skipCount`, `estimatedWaitMins`, `phoneNumber`, and `pushSubscription`, with foreign keys to `Service`, `Counter`, and `User`.
> 5. **`QueueAudit` (bottom-center):** Linked $1\text{-to-}N$ to `Ticket`, recording every status transition (`fromStatus`, `toStatus`), actor (`performedBy`), and `windowNumber`.
> 6. **`Counter` and `User` (top-right and middle-right):** Model physical service windows and staff/admin accounts, including boolean catering flags (`caterNew`, `caterRenewal`, `caterRetirement`, `autoAssign`) used during Peace and Crunch Mode auto-balancing.
> 7. **`Settings` (bottom-right):** Stores global parameters such as `slaThreshold`, `zipperRatio`, `agingRate`, and `skipLimit`.
>
> **Presenter 5** will now explain our behavioral and business process models from Figure 4 through Figure 8." *(Or Presenter 4 covers Figure 4 before handing off!)*

### Slide 16: Figure 4 · Use-Case Diagram — 17 use cases map to four actors
> "On Slide 16, **Figure 4: UML Use-Case Diagram** defines the functional boundary of the system across **four actors** and **17 use cases**:
> - On the **top-left**, the **Client / Citizen** interacts with four primary use cases: *Request & Print QR Queue Ticket* (which has mandatory `<<include>>` links to *Select Transaction Type* and *Predict Wait Time $E[W]$ via Phantom Simulation*), *View Public Monitor Display*, *Track Live Queue Status via QR Code Scan* (which is optionally extended via `<<extend>>` by *Subscribe to SMS / Web Push Notifications*), and *Receive Approaching Turn & Call Notifications*.
> - On the **bottom-left**, **BPL-LIEO Frontline Staff** *Authenticate User Session*, *Call Next Client* (which `<<include>>`s *Compute Smart Score $S(t)$* and *Auto-Balance Counter Loads*), *Recall Currently Served Ticket*, and *Update Ticket Status* (which mandatorily `<<include>>`s *Record Tamper-Evident Queue Audit Trail*).
> - On the **bottom-right**, the **BPL-LIEO Administrator** inherits authentication and manages *Staff Accounts & Counters*, *Priority/SLA/Zipper Parameters*, and *Statistical Reports & Audit Logs*.
> - On the **middle-right**, the secondary actor **Vonage SMS & Web Push Service** connects to subscription opt-in and turn notification delivery.
>
> I will now turn the floor over to **Presenter 5** for Figures 5 through 8."

---

## 🎤 PRESENTER 5 (Slides 17 – 20): System Models Part 2 (Figures 5 – 8) & Closing

### Slide 17: Figure 5 · Swimlane Diagram — A transaction traced end to end
> "Thank you. On Slide 17, **Figure 5: UML Swimlane Activity Diagram** traces the complete lifecycle of a single transaction across **four vertical swimlanes**: *Client / Citizen*, *Smart Queue Engine & System Server*, *BPL-LIEO Frontline Staff*, and *BPL-LIEO Administrator*.
> - Starting at the top-left black initial node, the client selects their transaction and priority group.
> - In the second lane, the system atomically generates the ticket number and hits a **horizontal Fork Bar**, executing two parallel actions simultaneously: saving to SQLite/Firebase while printing the QR ticket on the left, and evaluating counter load auto-balancing on the right, before joining at *Compute Smart Score $S(t)$*.
> - Back in the Client lane, a decision diamond checks if the citizen scans the QR code: if **`[Yes]`**, their phone/push subscription is saved and the engine checks if their true rank is $\le 2$ to send an approaching-turn alert; if **`[No]`**, they monitor the public TV display.
> - When Frontline Staff click **'Call Next'**, the system updates the ticket to `SERVING` and broadcasts the voice/chime alert.
> - At the counter, two decision diamonds handle real-world exceptions: first, **`Did Client Arrive at Counter?`**—if `[Absent]`, staff trigger a recall or mark `NO_SHOW`; if `[Present]`, documents are verified. Second, **`Transaction Complete?`**—if `[Incomplete]`, it is marked `POSTPONED (Return Tomorrow)`; if `[Completed]`, it is marked `COMPLETED (Done)`. All paths converge to append a `QueueAudit` record and update live Admin SLA reports."

### Slide 18: Figure 6 · Engine Activity Diagram — The engine scores tickets and balances counters
> "Slide 18 zooms into the brain of our software with **Figure 6: The Smart Queue Engine Activity Diagram**. Whenever a queue event or 5-minute timer fires, the engine splits at a parallel **Fork Bar** into two concurrent branches:
> - **On the Left Branch (Smart Score $S(t)$ Calculation):** The engine initializes $S(t) = P_{\text{base}} + (W_{\text{mins}} \times R_{\text{aging}})$ and passes through three sequential decision diamonds:
>   1. Is $W_{\text{mins}} \ge \text{SLA Threshold}$? If `[Yes]`, add **$+100\text{ pts}$ (SLA Panic Bonus)**.
>   2. Is $\text{skipCount} \ge 5$? If `[Yes]`, add **$+500\text{ pts}$ (Stoplight Skip Bonus)**.
>   3. Were the last $N$ served clients all priority while this is the oldest regular ticket? If `[Yes]`, add **$+1000\text{ pts}$ (Zipper Force Bonus)**.
>   It then sorts the waiting queue descending by $S(t)$ and computes Phantom Wait Time $E[W]$.
> - **On the Right Branch (Counter Auto-Balancing):** The engine calculates weighted service load per queue and checks if the maximum load exceeds $1.5\times$ the threshold or breaches $3\times\text{SLA}$. If **`[No — Normal Load]`**, it sets **Peace Mode**, where all auto-assignable counters cater to all services. If **`[Yes — High Load / SLA Breach]`**, it shifts into **Crunch Mode**, proportionally allocating windows ('Robin Hood' balancing) while guaranteeing at least 1 staff counter per active service."

### Slide 19: Figure 7 · BPMN 2.0 — Collaboration across three pools
> "On Slide 19, **Figure 7: BPMN 2.0 Collaboration Diagram** models cross-organizational choreography across **three horizontal pools**:
> - **Pool 1 (Top – Blue):** *Client / Citizen*
> - **Pool 2 (Middle – Gray):** *BPL-LIEO Smart Queuing System & Office Operations*, partitioned into *Lane 1 (Automated Smart Queue Engine & Backend Server)*, *Lane 2 (BPL-LIEO Frontline Counter Staff)*, and *Lane 3 (BPL-LIEO Administrator)*.
> - **Pool 3 (Bottom – Green):** *External Notification Services (Vonage SMS Gateway & Web Push Service)*.
>
> Unlike the Activity Diagram, BPMN 2.0 explicitly distinguishes **solid internal sequence flows** from **blue dashed cross-pool message flows (`- - ->`)**—showing exactly where network messages cross between the Citizen's device, the BPL-LIEO server, and the external Vonage telecom gateway, alongside the internal `SQLite (WAL) & Firebase Store` data store symbol."

### Slide 20: Figure 8 · As-Is / To-Be — From manual queuing to an automated workflow
> "Finally, on Slide 20, **Figure 8: BPMN 2.0 Process Transformation Diagram** summarizes the direct operational impact of our study by contrasting the **As-Is Manual Process (top red pool)** against our **To-Be Automated Process (bottom green pool)**:
> - In the **As-Is Manual Workflow**, citizens receive static paper numbers without an ETA, are confined to a crowded waiting room, are called verbally under rigid FIFO, frequently miss their turn when stepping outside, and staff must manually tally records.
> - In our **To-Be Automated Workflow**, citizens receive an atomic QR ticket with a Phantom Wait Time $E[W]$, track their live rank from anywhere on their phone, are fairly prioritized via Smart Score $S(t)$ and Peace/Crunch auto-balancing, receive advance SMS and Web Push alerts at Rank $\le 2$, and automatically generate tamper-evident `QueueAudit` and SLA analytics for the BPL-LIEO Administrator.
>
> Thank you very much for your time and attention. We are now ready to answer your questions!"
