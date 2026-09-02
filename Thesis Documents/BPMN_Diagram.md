# Business Process Model and Notation (BPMN)

This document contains a BPMN 2.0 style diagram representing the complete business workflow of the BPLO Queuing System. It utilizes swimlanes to distinguish the responsibilities of the Citizen, the Kiosk, the TV Display, and the BPLO Staff.

This diagram is ideal for the **Business Process** section of your thesis, as it illustrates the step-by-step physical and digital interactions from the moment a client walks in to the moment they leave.

## BPMN Workflow Diagram

```mermaid
flowchart TD
    %% Define Styles for BPMN elements
    classDef startEvent fill:#d4edda,stroke:#28a745,stroke-width:2px;
    classDef endEvent fill:#f8d7da,stroke:#dc3545,stroke-width:3px;
    classDef gateway fill:#fff3cd,stroke:#ffc107,stroke-width:2px,shape:diamond;
    classDef task fill:#e2e3e5,stroke:#6c757d;

    %% Swimlane: Citizen / Client
    subgraph Citizen [Citizen / Client]
        A((Start)):::startEvent --> B[Select Transaction Type on Kiosk]:::task
        D[Take Printed Ticket]:::task --> E[Wait in Lobby]:::task
        E -.->|Sees/Hears Number| K[Proceed to Assigned Window]:::task
        K --> M[Process Documents with Staff]:::task
        M --> S((End)):::endEvent
    end

    %% Swimlane: Kiosk System
    subgraph Kiosk [Kiosk System]
        B --> C[Generate Ticket & Save to Database]:::task
        C --> D
    end

    %% Swimlane: Staff Operations
    subgraph Staff [BPLO Staff / System]
        H[Staff clicks 'Call Next Ticket']:::task --> I[Update Ticket Status to SERVING]:::task
        I --> L[Wait for Citizen at Window]:::task
        L --> M
        M --> N{Outcome Gateway}:::gateway
        N -->|Finished| O[Click 'Complete']:::task
        N -->|Incomplete/Lacking| P[Click 'Tomorrow' Postpone]:::task
        N -->|Did not show up| Q[Click 'Skip']:::task
        O --> R[(Database: Update Status)]
        P --> R
        Q --> R
    end

    %% Swimlane: TV Display System
    subgraph TV [TV Display System]
        I -.->|Triggers Web Socket| J[Flash 'Now Serving' & Play Voice Alert]:::task
        J -.-> K
    end
```

## Detailed Process Explanation

1. **Start Event:** The process begins when a citizen enters the BPLO.
2. **Kiosk System (Self-Service):** 
   - The citizen interacts with the iPad/Tablet kiosk and selects their required service (New, Renewal, Retirement).
   - The system generates a categorized ticket number, saves it to the database, and provides the ticket to the citizen.
3. **Waiting State:** The citizen waits in the lobby.
4. **Staff Action (Call):** A BPLO staff member clicks "Call Next" on their computer dashboard. The system updates the ticket status from `WAITING` to `SERVING`.
5. **Broadcast (TV System):** The system instantly sends a real-time WebSocket event to the TV Display, which flashes the ticket number and plays a Text-To-Speech (TTS) audio alert (e.g., "Ticket NW-001, please proceed to Window 1").
6. **Service Execution:** The citizen hears the alert, approaches the window, and processes their documents with the staff.
7. **Gateway Resolution (Completion):** After the physical interaction, the staff makes a decision at the gateway:
   - **Complete:** The transaction was successful.
   - **Postpone (Tomorrow):** The citizen lacked requirements and must return the next day.
   - **Skip:** The citizen never approached the window.
8. **End Event:** The database is permanently updated with the final status and completion timestamp, and the citizen leaves the office.
