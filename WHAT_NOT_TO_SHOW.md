# WHAT NOT TO SHOW — The "Invisible by Design" List

## 1. RAW ERP TABLES
Executives are not database administrators.
*   **Action:** Never show a multi-column table on the executive surface. Show the **Anomaly** or the **Trend**, not the ledger.

## 2. "STABLE" METRICS
If a metric is within normal parameters, showing it consumes attention without providing value.
*   **Action:** Hide all "Green" metrics. If the business is healthy, the surface should be clean. Silence is the highest indicator of operational success.

## 3. INCOMPLETE OR STALE DATA
Surfacing data with < 50% confidence leads to "Wrong Decisions" or "System Distrust."
*   **Action:** If a data source is disconnected or stale, hide the dependent signals and show a single "Stale Data Risk" dot in the Executive Strip.

## 4. INDIVIDUAL TRANSACTION LOGS
Unless a single transaction represents a Level 5 Critical Failure (e.g., a $100k fraud event), individual logs are noise.
*   **Action:** Aggregate transactions into **Momenta** or **Volumes**.

## 5. SPECULATIVE "AI INSIGHTS"
Generic AI chatter ("Your sales are looking good today!") increases noise without providing utility.
*   **Action:** Only show AI-generated content if it is **Prescriptive** (e.g., "Drafting an email to resolve this freight gap").

## 6. REDUNDANT BUTTONS
Multiple paths to the same action increase decision friction.
*   **Action:** One "Primary Path" button per card. All secondary actions (Edit, Delete, History) belong in the Deep Dive modal.

## 7. UNFILTERED COMMONS
Shared queues without per-role filtering lead to "Not my problem" avoidance.
*   **Action:** Only show signals that the current user has the **Authority** and **Information** to resolve.
