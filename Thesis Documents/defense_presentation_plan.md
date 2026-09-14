# BPL-LIEO Defense Proposal Presentation Plan

This is a revised 12-slide outline for your Defense Proposal presentation. Based on your feedback, **Slides 3 and 4** have been strategically crafted to emphasize the **Research Gap** and your **System's Edge/Advantage**. This will directly address the panelists' expected questions about why your system is necessary and how it stands out from generic queuing solutions.

---

## Slide 1: Title
**Title:** DESIGN AND IMPLEMENTATION OF A REAL-TIME LAN-BASED QUEUING MANAGEMENT AND STATISTICAL REPORTING SYSTEM FOR THE BUSINESS PERMITS, LICENSING - LOCAL INVESTMENT AND ENTERPRISE OFFICE (BPL-LIEO) OF LGU ROSARIO, LA UNION
*   **Researchers:** Rojean F. Tandas, Manrijan M. Barbosa, Carren Nicole A. Estrelles, John David R. Garcia, Jade Allysa V. Rulloda
*   **Institution:** Don Mariano Marcos Memorial State University - South La Union Campus

---

## Slide 2: Situation Analysis (1/3) - The Current State
**Title: Situation Analysis: The Current State & Bottlenecks**
*   **The Context:** BPL-LIEOs accommodate a massive influx of clients during peak business registration and renewal periods.
*   **The Current Method:** Heavy reliance on manual queuing and verbal calling.
*   **The Bottlenecks:** 
    *   Disorganized client flow and overcrowding.
    *   Client uncertainty regarding queue position.
    *   Staff difficulty in simultaneously processing documents, managing the line, and tracking skipped or returning clients.

---

> [!IMPORTANT]
> **Presenter Tip for Slide 3:** Do not claim that your features have "never been invented before." Instead, explicitly state that enterprise systems have these features but are priced out of reach for LGUs. This is "The Accessibility Gap."

## Slide 3: Situation Analysis (2/3) - The Accessibility Gap
**Title: The Research Gap: The Affordability and Infrastructure Divide**
*   **The Reality of the Market:** Advanced queuing features (AI forecasting, audit trails) exist in enterprise platforms like Qminder and Wavetec, but they require expensive recurring subscriptions and fast, reliable cloud internet.
*   **The LGU Limitation:** Free cloud-based queuing systems exist, but they strip out essential analytics and fail entirely when the internet goes down. Municipal LGUs like Rosario cannot afford enterprise fees nor rely on unstable internet.
*   **The True Gap:** There is no free, fully offline, self-hosted queuing system that provides enterprise-grade accountability and analytics tailored for the specific workflow of a local government office.

---

> [!TIP]
> **Presenter Tip for Slide 4:** This is your strongest slide. You are proving that your system democratizes expensive enterprise features for the BPL-LIEO.

## Slide 4: Situation Analysis (3/3) - Our Competitive Edge
**Title: Our Edge: Democratizing Enterprise Features for the LGU**
*   **Immutable Audit Trails (Free vs. Paid):** While commercial systems lock staff accountability logs behind expensive "Service Intelligence" paywalls, our system natively includes tamper-evident logging to ensure LGU transparency—at zero cost.
*   **Prescriptive Bottleneck Alerts:** Instead of just showing past data, our system uses real-time rolling averages to detect if a specific queue (e.g., Renewals) is moving too slowly, instantly alerting the Admin to open a new window.
*   **100% Infrastructure Independence:** By running entirely on a Local Area Network (LAN) utilizing React, Node, and Prisma, we guarantee zero downtime even during municipal internet outages.
*   **Native "Return Tomorrow" Handling:** Instead of relying on paid SMS appointment add-ons, we built priority re-entry directly into the local workflow to accommodate clients with incomplete requirements.

---

## Slide 5: Statement of Objectives
**Title: Statement of Objectives**
*   **General Objective:** To design and implement a Real-Time LAN-Based Queuing Management and Statistical Reporting System specifically adapted for the Rosario BPL-LIEO.
*   **Specific Objectives:**
    1.  To design and develop an automated LAN-based system (Ticket Generator, Staff Dashboard, Public Monitor, Admin Analytics).
    2.  To test and improve system performance via alpha and beta testing.
    3.  To assess software quality based on ISO/IEC 25010 Standards.

---

## Slide 6: Research Design
**Title: Research Design**
*   **Developmental Research:** Systematically designing, building, and refining the queuing software to directly solve the operational bottlenecks of the BPL-LIEO.
*   **Descriptive Research:** Utilized to objectively evaluate the system's quality and gather quantitative feedback from both staff and citizens compared to their experience with the manual method.

---

> [!TIP]
> **Presenter Tip for Slide 7:** This is where you demonstrate technical rigor. Mentioning "Star Topology" and "Engineered Fault Tolerance" proves you understand the infrastructure, not just the code.

## Slide 7: Materials and Procedure (1/4) - Infrastructure & Tech Stack
**Title: Architecture: Network Topology & Modern Tech Stack**
*   **Network Infrastructure (Star Topology):** A central wireless router connects all local devices (Server, Staff Laptops, TV Display). This ensures that if one staff laptop disconnects, the rest of the system remains fully operational.
*   **Engineered Fault Tolerance (100% Uptime):**
    *   **PM2 Process Manager:** Automatically restarts the Node.js server within a second if a crash occurs.
    *   **SQLite WAL Mode:** "Write-Ahead Logging" prevents database corruption during sudden power outages.
    *   **Socket.io Auto-Reconnect:** Client screens seamlessly re-sync without requiring manual page refreshes if the network drops.
*   **Software Stack:** React.js (Frontend), Node.js & Express.js (Backend), Prisma ORM (Database).

---

## Slide 8: Materials and Procedure (2/4) - SDLC
**Title: Procedure: Agile Methodology**
*   **Approach:** Agile Software Development Life Cycle (SDLC).
*   **Why Agile?** It allows us to build the system incrementally in sprints, ensuring we can easily adapt the software based on direct feedback from BPL-LIEO personnel during development.
*   **Phases:** Plan, Design, Develop, Test, Deploy and Review.

---

## Slide 9: Materials and Procedure (3/4) - System Design
**Title: Procedure: System Architecture & Modeling**
*   **Visualizing the Solution:**
    *   **BPMN Diagram:** Maps the step-by-step physical and digital interactions from the citizen's arrival to departure.
    *   **Entity-Relationship Diagrams (ERD):** Ensuring robust transaction data storage.
    *   **Data Flow & Use-Case Diagrams:** Defining clear roles for Citizens vs. Staff.
*   *(Note: You can display the BPMN Diagram you have in the `Thesis Documents` folder here).*

---

## Slide 10: Materials and Procedure (4/4) - Testing Procedures
**Title: Procedure: System Testing**
*   **Continuous Testing:** Ensuring code quality and real-time Socket.io stability.
*   **Alpha Testing:** Conducted in a controlled lab environment by developers to iron out initial logic and UI bugs.
*   **Beta Testing:** The crucial phase—deployed on the *actual* BPL-LIEO LAN environment and tested by *actual* personnel to validate network performance and usability under real-world conditions.

---

## Slide 11: Data Gathered
**Title: Data Gathering Procedures**
*   **Assessment Tool:** A customized survey questionnaire based on the ISO/IEC 25010 Software Quality Model (adapted from Malaya et al., 2022).
*   **Respondents (Total N = 60):**
    *   **BPL-LIEO Staff:** 10 respondents (Total Enumeration) - evaluating operational efficiency and staff controls.
    *   **Citizens / Clients:** 50 respondents (Convenience Sampling) - evaluating public monitor visibility and process transparency.

---

## Slide 12: Data Analysis
**Title: Data Analysis**
*   **Statistical Tool:** Weighted Mean
*   **Evaluation Scale:** 5-point Likert Scale assessing seven ISO/IEC 25010 characteristics (Functionality, Usability, Efficiency, Reliability, Security, Maintainability, Portability).
*   **Goal:** To determine the descriptive equivalent rating (from Poor to Excellent) and definitively prove the system's acceptability and superiority over the manual method.
