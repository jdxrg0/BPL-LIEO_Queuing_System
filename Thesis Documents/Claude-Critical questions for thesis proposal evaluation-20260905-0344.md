# Critical questions for thesis proposal evaluation

**Created:** 9/5/2026 3:29:01  
**Updated:** 9/5/2026 3:34:15  
**Exported:** 9/5/2026 3:44:17  
**Link:** [https://claude.ai/chat/59eeaef3-7e40-4ad9-974e-42be8cf5bba4](https://claude.ai/chat/59eeaef3-7e40-4ad9-974e-42be8cf5bba4)  

## User:

> 9/5/2026 3:29:04

> File: BPL-LIEO - Manuscript - Rojean - 09-01-26.pdf

> File: BPL-LIEO Defense Proposal Presentation.pdf

If you were a very smart and skeptic panel member. What questions are you going to ask for this Thesis Proposal?

## Assistant:

> 9/5/2026 3:31:59

> Covering sampling, ethics, and sustainability concerns next.
>
> - Deciding whether uploaded content warrants a memory update.
> - Reading memory
> - Covering sampling, ethics, and sustainability concerns next.
> - **Done**

Got it — you want me to play the toughest, most skeptical panel member and pressure-test this specific manuscript and defense deck for real weak points, not just surface-level typos.

Before I dump the full list — I'm assuming you want *comprehensive* coverage (methodology, technical feasibility, ethics, etc.), not just one chapter. Tell me if you want me to narrow it down after this.

Here's what I'd hit hardest, grouped by how damaging each line of questioning would be:

## 🔴 Structural gaps (these get asked in the first 5 minutes)

- **"Where's your Statement of the Problem?"** — Your TOC jumps from Situation Analysis straight to Statement of Objectives. A rigorous panel expects explicit, falsifiable sub-problems the study answers — objectives alone aren't a substitute.
- **"Where's your Scope and Delimitation, and Significance of the Study?"** — Neither appears in your TOC. Panel will ask exactly which transactions are excluded (e.g., business closure, tax clearance?) and who specifically benefits and how.
- **"Where's your Conceptual/Theoretical Framework?"** — You have BPMN, ERD, and DFD, but no IPO (Input-Process-Output) model or similar tying it together conceptually.

## 🟠 Objectives that aren't actually measurable

- Your objectives say "reduce waiting time," "improve queue management," "enhance efficiency" — **by how much?** What's your current baseline (manual system) waiting time, and what's your target? Without a baseline measurement *before* deployment, you can't credibly claim improvement later — your evaluation instrument only measures *perceived* quality via Likert scale, not actual time saved.

## 🟠 Literature-to-design gap

- You cite Ainbinder et al. (queue architecture) and Lee et al. (priority queueing) — **which specific algorithm or rule did you actually implement**, or is this just thematic framing without technical adoption?
- Torion & Bacio (2024) — cited for your "developmental research design" — is about video lessons for an intro computing course. How directly transferable is that framework to a queuing system?

## 🟠 Methodology rigor

- **How did you arrive at n = 50 out of 150 citizens?** No formula (e.g., Slovin's — a standard way to compute sample size from a known population) is shown.
- **Convenience sampling** (surveying whoever happens to be around and willing) introduces selection bias — likely toward more tech-comfortable, patient clients. How will you address this in your limitations?
- You adapted the ISO/IEC 25010 questionnaire from Malaya et al. (2022) — a *research information system* study, a different domain. **Did you pilot-test it or run a reliability check (Cronbach's alpha — a statistic confirming your survey items are internally consistent)** before using it here? Some items ("identity of the external service provider is authenticated") read like they were copied verbatim from a web-services context, not adapted to a LAN queuing app.

## 🔴 Technical feasibility (a CS panel will go here fast)

- **SQLite is a single-writer, file-based database.** With multiple staff dashboards writing ticket status updates concurrently, how do you handle write locks/race conditions? You list PostgreSQL as an alternative — why not use it for production given concurrency needs?
- Your deck claims **"guarantees 100% uptime"** — no system guarantees that. What's your fallback if the router, a laptop, or power fails mid-operation?
- Explain the actual algorithm for merging "Priority Waiting" (returning) clients back into the queue — how do you prevent regular waiting clients from feeling unfairly bumped?
- Your own survey asks about "authenticity" and "role-based access control," but Chapter 2 never describes your authentication design. What is it?

## 🟡 Testing validity

- Alpha testing is done by "peer developers" (yourselves) — that's a bias risk. What's your actual test case coverage (edge cases like a network drop mid-transaction, or two staff calling the same ticket simultaneously)?

## 🔴 Ethics & legal — likely to catch you off guard

- This system stores **citizen and business transaction data** in a government office. How does it comply with the **Data Privacy Act of 2012 (RA 10173)** — retention, access control, breach protocol?
- Did you secure informed consent from staff and citizen respondents, and was this cleared by any ethics/research committee?

## 🟡 Sustainability & scope

- After you graduate, **who maintains and hosts this system?** Does Rosario LGU have in-house IT capacity, or does it die with your thesis?
- Who funds the hardware (printer, Smart TV, router)? Is that in your budget, or the LGU's?
- The system is tightly customized to Rosario's specific workflow — how transferable is it to other BPL-LIEOs? Is that a stated limitation?

## 🟢 Minor red flags to fix before defense day
- Abstract lists **"(2027)"** as the publication year — confirm that's intentional and matches your timeline, not a typo.
- You cite ISO/IEC 25010:**2011** — a 2023 revision exists; be ready to explain the choice.
- Deck typo: "Software **Staack**."

**Related thing worth knowing:** panels weigh the "no baseline measurement" and "SQLite concurrency" questions the heaviest, because they attack your core evaluation claim and your core technical architecture respectively — those are the two I'd rehearse answers for first.

Want me to help you draft solid answers to the toughest ones (baseline measurement and SQLite concurrency), or help you write the missing sections (Statement of the Problem, Scope and Delimitation, Significance) first?

## User:

> 9/5/2026 3:32:44

Now, if you were the Researchers, how will you response? And how are we going to solve this if its really a concerning topic, instead of just defensing it--I mean, we are prepping so we should solve the issues and develop a better and more defensable research

## Assistant:

> 9/5/2026 3:34:15

> Calculating sample size margins and organizing the full response.
>
> - Calculating sample size margins and organizing the full response.
> - **Done**

You want me to flip perspective — respond as the research team defending each critique, but more importantly give you concrete fixes so these stop being weaknesses by defense day instead of just things you talk your way around.

Good instinct. A panel can tell the difference between "we have a rehearsed answer" and "we actually fixed it." Since this is still the **proposal** stage (Chapters 1–2, pre-Chapter 3 development), you have real runway to build fixes into the system itself, not just the paper. Here's both layers for each issue, tiered by urgency:

## 🔴 Fix before defense — these are cheap to fix and panels always check them

**Missing Statement of the Problem / Scope & Delimitation / Significance / Conceptual Framework**
- *Say:* "These are being finalized per the university's standard format; we can walk you through the draft."
- *Actually fix:* Write them now — they're mostly re-organizing what you already have.
  - Statement of the Problem: pull 3–4 sub-problems as questions from your Situation Analysis (e.g., "What is the current average client waiting time and its causes?" "What functional requirements does BPL-LIEO staff need for queue control?")
  - Scope and Delimitation: state exactly which transactions are covered (new registration, renewal) and excluded (online applications, payment processing, other LGU offices)
  - Significance: name each beneficiary explicitly — BPL-LIEO staff, clients, LGU administration, future researchers
  - Conceptual Framework: a simple Input–Process–Output diagram tying your BPMN/ERD/DFD together

**Sample size has no formula shown**
- *Say:* "We used a practical sample given time constraints."
- *Actually fix:* Run Slovin's formula (n = N / (1 + Ne²)) and cite it. With N=150 and n=50, your actual margin of error is **~11.5%**. Either state that explicitly as a justified trade-off, or bump n to 60 for a cleaner ±10%. Either is defensible — silence is not.

**Abstract year "(2027)" and ISO 25010:2011 vs. 2023**
- *Fix:* Confirm the year matches your actual timeline. For the ISO version, just add one sentence: "This study uses ISO/IEC 25010:2011, the version most consistently applied in comparable Philippine LGU system evaluations (e.g., Malaya et al., 2022)."

## 🔴 Fix before defense — these need a real design decision, not just a paragraph

**No baseline measurement (can't prove "reduced waiting time")**
- *Say:* "Our primary evaluation is software quality via ISO 25010, not time-benchmarking."
- *Better — actually fix it:* Your system already timestamps ticket events (issued, called, completed). Use that. Log a short **manual observation baseline** (staff estimates or direct observation over a few days) before deployment, then let the deployed system auto-log real waiting/service times during Beta testing. Now you have an *objective*, non-survey before/after comparison — genuinely strengthens the study and it's nearly free since the data's already flowing through your DB.

**Priority/fairness algorithm for "Return Tomorrow" clients isn't defined**
- *Fix:* Write the actual rule down. E.g., "A Priority Waiting ticket is inserted immediately after the currently-serving ticket but does not bypass a client already next in line" — then diagram it. This is a 30-minute fix that closes a real design hole.

**No authentication/RBAC design despite your own questionnaire asking about it**
- *Fix:* Add a short "System Security Design" paragraph: role-based login (Staff vs. Admin), hashed passwords, session-based access control. Even a basic design beats silence.

## 🟡 Defensible with a good answer + becomes future work

**SQLite concurrency under multiple staff writers**
- *Say:* "BPL-LIEO has a small number of concurrent service windows (2–4), well within SQLite's practical write throughput, especially with Write-Ahead Logging (WAL) mode enabled, which lets reads proceed during writes."
- *Actually strengthen it:* Turn on WAL mode in your Prisma/SQLite config (one line), and explicitly test it under your planned stress-testing objective. Note PostgreSQL migration as a stated path for scaling to larger offices — this turns a weakness into "we thought about scale and made an informed trade-off."

**"Guarantees 100% uptime" claim**
- *Fix:* Just soften the wording — "high availability within the LAN, independent of external internet connectivity" — and add one contingency line: staff can revert to manual calling if hardware fails. Absolute claims are the easiest thing for a skeptical panelist to puncture; don't hand them the opening.

**Literature cited but not clearly operationalized**
- *Say:* "These studies informed our design conceptually rather than algorithmically."
- *Better:* Add one short paragraph or table explicitly mapping each cited concept to a feature (e.g., "Lee et al.'s flexible priority scheme → our Priority Waiting status"). Costs you a paragraph, earns real credibility.
- Also consider swapping the Torion & Bacio (2024) citation for something more directly about developmental research in software/systems contexts — it's currently a stretch.

## 🟡 Needs a real add, but straightforward

**Data Privacy Act (RA 10173) compliance**
- *Fix:* Add a short subsection — access control, encrypted storage for PII fields, a stated retention period for ticket/transaction logs. This is standard for any PH thesis touching citizen data and panels will expect to see it named explicitly.

**Informed consent / ethics clearance**
- *Fix:* If you haven't already, get a simple consent form signed by interview/survey participants and attach it as an appendix. Check with your adviser — DMMMSU likely has a template.

**Sustainability / who maintains this after you graduate**
- *Fix:* Add a short "Technology Transfer Plan" — source code handover, staff training session, basic maintenance documentation. Your BPL-LIEO commitment letter already signals support; use it as evidence you've thought about this.

**Budget/hardware funding**
- *Fix:* One sentence in Materials and Procedures clarifying who provides what (researchers' dev hardware vs. LGU-provided production hardware per the commitment letter).

---

**Related thing worth flagging:** the baseline-measurement fix and the missing-sections fix are the two highest-leverage moves here — they're each just a few hours of writing/config, but they directly disarm your two most damaging questions (unmeasurable claims, and "your proposal isn't even structurally complete").

Want me to draft the actual missing sections (Statement of the Problem, Scope and Delimitation, Significance, Conceptual Framework) as ready-to-paste text next, or start with the Slovin's formula + baseline-measurement plan since those are what a panel will drill into hardest?

Powered by Claude Exporter (https://www.ai-chat-exporter.net)
