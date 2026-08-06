# Chapter 2
# METHODOLOGY

## Research Design
The researchers will utilize a combination of **Developmental Research** and **Descriptive Research** designs. Developmental research will be employed to systematically design, develop, and evaluate the Real-Time LAN-Based Queuing Management and Statistical Reporting System for the Business Permit and Licensing Office (BPLO). This approach is appropriate as the primary goal of the study is to create a functional technological solution to an existing problem.

Simultaneously, descriptive research will be used during the evaluation phase to assess the system's acceptability, efficiency, and usability. This will involve surveying the end-users (BPLO staff and citizens) to describe their experience and gather quantitative feedback on the system's performance compared to the traditional manual queueing method.

## Materials and Procedures

### Materials
The development of the system will utilize the following hardware and software tools:
*   **Hardware:** Laptops/Desktops for development and staff usage, a thermal printer (or standard printer) for ticket generation, a Smart TV or monitor for the queue display, and local area network (LAN) routers.
*   **Software (Tech Stack):** 
    *   **Frontend:** React.js, HTML5, Vanilla CSS for the user interfaces (Staff Dashboard, Admin Panel, TV Display).
    *   **Backend:** Node.js with Express.js framework for handling API requests.
    *   **Database:** Prisma ORM with a relational database (SQLite/PostgreSQL) to store ticket records, user accounts, and analytics.
    *   **Real-time Communication:** Socket.io for live updates between the Staff Dashboard and the TV Display.
    *   **Development Tools:** Visual Studio Code (VS Code), Git for version control, and web browsers (Chrome/Edge) for testing.

### Software Development Life Cycle (SDLC)
The study will adopt the **Agile Methodology** as its SDLC model. Agile allows for continuous iteration, testing, and feedback throughout the development process. 
1.  **Requirements Gathering:** Interviewing BPLO staff to understand the current bottleneck and defining the system features (e.g., System-generated printed ticketing, Staff Dashboard, Return Tomorrow priority feature).
2.  **Design:** Creating wireframes, Entity-Relationship Models, Data Flow Diagrams, and Use-Case diagrams.
3.  **Development:** Writing the code for the frontend interfaces and backend APIs.
4.  **Testing:** Conducting unit testing, integration testing, and simulated user testing to ensure real-time socket connections work properly.
5.  **Deployment & Review:** Deploying the system on the local BPLO network and gathering user feedback for further refinements.

### Survey Questionnaire (ISO 25010 Based)
To evaluate the system, a customized survey questionnaire based on the ISO 25010 Software Quality Standards will be distributed. The questionnaire will cover:
1.  **Functional Suitability:** Does the system generate tickets and call numbers accurately?
2.  **Performance Efficiency:** Is the system fast and responsive?
3.  **Usability:** Is the printed ticket format clear and is the TV Display easy for citizens to follow? Is the dashboard intuitive for staff?
4.  **Reliability:** Does the system maintain data integrity without crashing?

### Answering the Statement of Objectives
*   **Objective 1 (Design and Develop):** Addressed through the Agile development process, utilizing the React.js and Node.js tech stack.
*   **Objective 2 (Test and Improve):** Addressed by conducting alpha and beta testing with the system, utilizing real-time socket events and fixing identified bugs.
*   **Objective 3 (Evaluate Acceptability):** Addressed by distributing the survey questionnaire to the respondents and analyzing their feedback.

## Data Gathering

To determine the system's effectiveness and acceptability, data will be gathered after the system is deployed for a trial period. The researchers will distribute the survey questionnaires to two groups: the BPLO staff who operate the system and print tickets, and the citizens/clients who receive their printed tickets and monitor the TV display. 

Because the citizen population varies daily, a convenience sampling method will be used for the clients, while total enumeration will be used for the BPLO staff.

**Table 1. Distribution of Respondents**

| Respondents | Total Population (N) | Sample Population (n) |
| :--- | :--- | :--- |
| BPLO Staff | 10 | 10 |
| Citizens / Clients | 150 | 50 |
| **TOTAL** | **160** | **60** |

## Data Analysis

To analyze the data gathered from the survey questionnaires, the researchers will use **Weighted Mean**. This statistical tool is appropriate for determining the average response of the participants based on a Likert Scale. 

The respondents will rate the system's usability, efficiency, and reliability using a 5-point Likert Scale:
*   **5** - Strongly Agree (Excellent)
*   **4** - Agree (Very Good)
*   **3** - Neutral (Good)
*   **2** - Disagree (Fair)
*   **1** - Strongly Disagree (Poor)

The formula for the weighted mean will be used to interpret the overall acceptability of the queuing management and statistical reporting system.

## LITERATURE CITED

*Note: You will need to add your specific related literature here based on Chapter 1. Here is the APA 7th Edition format structure:*

Author, A. A., & Author, B. B. (Year). Title of the article. *Name of the Periodical, volume*(issue), #-#. https://doi.org/xxxx
Smith, J. (2022). The impact of digital queueing systems in local government units. *Journal of Public Administration Technology, 14*(2), 45-60.
