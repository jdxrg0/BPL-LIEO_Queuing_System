# Data Flow Diagrams (DFD)

This document contains the Data Flow Diagrams representing how information moves through the BPLO Queuing System. These diagrams are essential for Chapter 3 of your thesis (System Architecture & Design).

## 1. Context Diagram (Level 0 DFD)

The Context Diagram provides a high-level overview of the entire system, showing how external entities (Clients, Staff, and Admins) interact with the BPLO Queuing System as a whole.

```mermaid
flowchart TD
    %% External Entities
    CLIENT((Citizen / Client))
    STAFF((BPLO Staff))
    ADMIN((Administrator))

    %% Main System (Process 0)
    SYS[0. BPLO Queuing System]

    %% Data Flows - Client
    CLIENT -- Selects Transaction Type --> SYS
    SYS -- Issues Queue Ticket & TV Updates --> CLIENT

    %% Data Flows - Staff
    STAFF -- Sends Call / Complete / Postpone Actions --> SYS
    SYS -- Provides Waiting Queue & Ticket Info --> STAFF

    %% Data Flows - Admin
    ADMIN -- Updates Settings & Staff Roles --> SYS
    SYS -- Generates Statistical Reports --> ADMIN
```

---

## 2. Level 1 Data Flow Diagram

The Level 1 DFD breaks down the main system into specific processes (Ticket Generation, Queue Management, Broadcasting, and Administration) and shows how data is stored and retrieved from the system's database tables.

```mermaid
flowchart TD
    %% External Entities
    CLIENT((Citizen))
    STAFF((BPLO Staff))
    ADMIN((Administrator))

    %% Data Stores (Database Tables)
    D1[(D1: Tickets DB)]
    D2[(D2: Users DB)]
    D3[(D3: Services/Counters DB)]
    D4[(D4: Settings DB)]

    %% Processes
    P1[1. Ticket Generation Process]
    P2[2. Queue Management Process]
    P3[3. Broadcast Updates Process]
    P4[4. Administration & Reporting Process]

    %% Process 1: Kiosk Ticket Generation
    CLIENT -- Requests Service Type --> P1
    D3 -- Provides Prefix Rules --> P1
    P1 -- Inserts New Ticket --> D1
    P1 -- Prints Queue Number --> CLIENT

    %% Process 2: Staff Dashboard
    D1 -- Sends Waiting List --> P2
    STAFF -- Sends Status Update Actions --> P2
    P2 -- Updates Ticket Status --> D1
    P2 -- Triggers Real-Time Socket Event --> P3

    %% Process 3: TV Display Broadcast
    D1 -- Provides Currently Serving Ticket --> P3
    D4 -- Provides Custom Logo & Branding --> P3
    P3 -- Displays Visuals & Plays Audio TTS --> CLIENT

    %% Process 4: Admin Dashboard
    ADMIN -- Submits Configuration & Roles --> P4
    P4 -- Updates User Data --> D2
    P4 -- Updates Configurations --> D3
    P4 -- Updates Branding --> D4
    D1 -- Provides Historical Transaction Data --> P4
    P4 -- Outputs Statistical Charts & Reports --> ADMIN
```

### Explanation of Level 1 Processes:
1. **Ticket Generation Process (Kiosk):** Takes the citizen's request, reads the service rules from D3, saves the ticket into D1, and gives the citizen their number.
2. **Queue Management Process (Staff Dashboard):** Reads the waiting list from D1, accepts actions from the staff (Call, Complete, Postpone), updates the database, and alerts the broadcast system.
3. **Broadcast Updates Process (TV Display):** Listens for events from Process 2, fetches the current ticket from D1 and branding from D4, and announces the ticket to the citizen via visuals and voice.
4. **Administration & Reporting Process (Admin Dashboard):** Allows the admin to manage D2, D3, and D4. Most importantly, it pulls historical completed tickets from D1 to generate printable performance statistics.
