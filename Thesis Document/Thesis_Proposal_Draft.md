# Thesis Proposal Draft: BPLO Queuing System

## 1. Proposed Thesis Titles

Here are three options for your thesis title, ranging from highly technical to more outcome-focused:

* **Option 1 (Technical & Descriptive):** 
  *Design and Implementation of a Real-Time LAN-Based Queuing Management and Statistical Reporting System for the Business Permit and Licensing Office (BPLO)*
* **Option 2 (Outcome-Focused):** 
  *Enhancing Public Service Efficiency through a Real-Time Local Area Network Queuing System: A Case Study for BPLO*
* **Option 3 (Modern/Concise):** 
  *Development of an Offline Real-Time Queuing Management System with Data Analytics for Local Government Units*

---

## 2. Statement of Objectives

### General Objective
To design, develop, and deploy a robust, real-time Queuing Management System tailored for the Business Permit and Licensing Office (BPLO) to streamline the flow of transactions, reduce citizen wait times, and improve overall public service delivery through automated data tracking.

### Specific Objectives
1. **Self-Service Kiosk:** To develop an intuitive, self-service tablet kiosk interface that allows citizens to securely generate queue tickets for specific transaction types (New Application, Renewal, Retirement).
2. **Real-Time Staff Dashboard:** To implement a WebSocket-based Staff Dashboard that enables government personnel to seamlessly manage, call, postpone, and serve tickets without page reloads.
3. **Automated TV Display:** To create a dynamic TV Display system that visually alerts citizens and audibly announces ticket numbers using Text-to-Speech (TTS) technology.
4. **Administrative Control:** To establish an Admin Dashboard capable of managing user roles, configuring dynamic counter assignments, and customizing system appearances (e.g., logos and website names).
5. **Data Analytics & Reporting:** To develop a statistical reporting module that generates printable performance reports based on transaction volumes, individual employee service rates, and historical queue data.
6. **Offline High-Availability:** To architect and deploy the system entirely on a Local Area Network (LAN) using a local database (SQLite) to ensure high availability, fast response times, and data security without requiring an active internet connection.

---

## 3. Rationale and Background of the Study

### Context and the Problem
The delivery of public services by Local Government Units (LGUs), particularly through the Business Permit and Licensing Office (BPLO), is a critical component of local economic development. The BPLO processes a high volume of transactions daily, reaching extreme peak levels during the annual business renewal periods in January. 

Traditional, manual queuing methods—such as physical logbooks, manual paper dispensing, and vocal calling by staff—are highly inefficient. These outdated methods often result in congested waiting areas, disorganized transaction flows, "queue jumping," and prolonged wait times. This not only causes immense frustration among citizens but also decreases the operational efficiency of government staff, leading to fatigue and reduced transaction throughput. Furthermore, manual systems lack the ability to record precise service times, making it nearly impossible for administration to accurately evaluate employee performance or identify operational bottlenecks.

### The Solution
The integration of Information and Communication Technology (ICT) into public administration, often termed *e-Governance*, has been shown to significantly enhance transparency and efficiency. By implementing a digitized Queuing Management System (QMS), the BPLO can automate the distribution and calling of queue numbers. 

### Relevance and Significance
This project aligns directly with the global shift towards digital transformation and smart city initiatives within government sectors. By utilizing a modern, real-time technology stack (Node.js, React, WebSocket) deployed over a Local Area Network (LAN), the proposed system offers a unique advantage: it is highly responsive, cost-effective, and completely immune to internet outages. 

Furthermore, the inclusion of an automated statistical reporting module elevates the system from a simple queuing tool to a comprehensive management asset. It provides the BPLO administration with data-driven insights into employee performance and peak transaction periods, allowing for strategic resource allocation, data-backed policy changes, and ultimately, a vastly improved public service experience.
