# Print Ticket Analysis

## Overview
The Print Ticket feature in the BPL-LIEO Queuing System allows administrators to generate and print physical paper tickets in bulk. These tickets contain queue numbers and QR codes that walk-in clients can scan to track their queue status via a mobile live tracker.

## Core Components
1. **`PrintTicketsModal.jsx` (Admin UI)**: The modal where admins configure the print job.
2. **`PrintTickets.jsx` (Print Layout Engine)**: The dedicated route component that actually renders the grid of tickets and triggers the browser's print dialog.
3. **`PrintTicket.jsx` (Standalone Component)**: A single-ticket component design.

## Details & Data Flow
- Initiated via the `AdminDashboard`.
- The generation of bulk tickets happens entirely on the client-side.
- The `PrintTickets` component uses CSS grid and print media queries to ensure proper layout (4 columns x 5 rows = 20 tickets per page).
- QR codes are dynamically generated using the `qrcode.react` library.

## Architectural Note
Since the bulk print job does not make `POST /tickets` API calls, these physical tickets act as offline placeholders. The system handles live queue tracking via the `ReceptionistDashboard` when tickets are formally issued to the database.
