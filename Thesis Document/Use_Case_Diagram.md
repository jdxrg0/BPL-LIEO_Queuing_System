# Use Case Diagram

This document contains the Use Case Diagram for the BPLO Queuing System, illustrating the primary actors and the specific actions (use cases) they can perform within the system boundaries. This is another crucial diagram for Chapter 3 of your thesis.

## Diagram

```mermaid
flowchart LR
    %% Define Styles
    classDef actor fill:#f8f9fa,stroke:#343a40,stroke-width:2px;
    classDef usecase fill:#e2e3e5,stroke:#6c757d,stroke-width:1.5px,rx:20,ry:20;
    classDef system fill:#ffffff,stroke:#007bff,stroke-width:2px,stroke-dasharray: 5 5;

    %% Actors
    Citizen((Citizen)):::actor
    Staff((BPLO Staff)):::actor
    Admin((Administrator)):::actor

    %% System Boundary
    subgraph System [BPLO Queuing System]
        %% Citizen Use Cases
        UC1([Select Transaction Type]):::usecase
        UC2([Receive Printed Ticket]):::usecase
        UC3([View TV Display & Hear Alerts]):::usecase
        
        %% Staff Use Cases
        UC4([Login to Dashboard]):::usecase
        UC5([Monitor Waiting Queue]):::usecase
        UC6([Call Next Client]):::usecase
        UC7([Update Status: Complete / Postpone / Skip]):::usecase
        UC8([Re-admit Returning Postponed Clients]):::usecase
        
        %% Admin Use Cases
        UC9([Manage Employee Accounts & Roles]):::usecase
        UC10([Manage Service Types & Counters]):::usecase
        UC11([Configure Branding: Logo & Name]):::usecase
        UC12([Generate & Print Statistical Reports]):::usecase
    end

    %% Citizen Interactions
    Citizen --- UC1
    Citizen --- UC2
    Citizen --- UC3

    %% Staff Interactions
    Staff --- UC4
    Staff --- UC5
    Staff --- UC6
    Staff --- UC7
    Staff --- UC8
    
    %% Admin Interactions (Admins also need to login)
    Admin --- UC4
    Admin --- UC9
    Admin --- UC10
    Admin --- UC11
    Admin --- UC12
```

## Actor Descriptions

1. **Citizen / Client:** The primary end-user of the system's front-facing interfaces. Their interaction is limited entirely to the Kiosk for generating tickets, and the TV display for receiving queue updates. They do not have access to any dashboards.
2. **BPLO Staff:** The personnel stationed at the service windows. They have restricted access to the dashboard where they can only view and manipulate tickets assigned to the specific services they are authorized to handle (e.g., New Applications vs. Renewals).
3. **Administrator:** The system manager (often the BPLO Head or IT personnel). They possess full privileges to oversee the entire system, manage the staff accounts, update the visual branding of the office, and pull analytics and reports to track office performance.
