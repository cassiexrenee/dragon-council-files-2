# Dragon Council Workspace — Strategic Development Roadmap

## Project Vision & Milestone Track

The Dragon Council Workspace is an alliance management and decision telemetry platform for Call of Dragons. This document tracks deployed core systems and upcoming feature deployments.

---

## 🟢 Phase 1: Deployed Core Systems (v1.0)

- [x] **5-Layer Decision Pipeline**: Automated merit ratios, baseline scoring, and role classification engine.
- [x] **Collapsible Sidebar & Responsive Layout**: Streamlined command navigation sidebar with officer profile ledger.
- [x] **Multi-Account Identity Linking**: Grouping Main, Alt, and Farm characters per lord.
- [x] **War Logs & Roster Ledger**: Battle-by-battle attendance, merit progression tracking, and manual overrides.
- [x] **CSV/JSON Import Center**: Bulk ingestion of DragonStats data and war telemetry snapshots.

---

## 🟡 Phase 2: Planned Reintegrations & Feature Queue

### 1. Discord Automated Webhooks Gateway
> **Status:** Queued for Future Use  
> **Description:** Automated dispatch of critical performance evaluation alerts, compliance notices, and weekly roster digests directly to designated Discord officer channels via webhooks.  
> **Key Capabilities:**
> - Broadcasters for critical roster evaluation alerts, power drop flags, and seasonal compliance summaries.
> - Custom Discord channel webhook URL management and automated payload encryption.
> - Integration with candidate recruitment intake notifications.

### 2. Recruitment Application Portal (Priority Reintegration)
> **Status:** Queued for Reintegration  
> **Description:** External candidate intake and evaluation portal.  
> **Key Capabilities to Reintegrate:**
> - Interactive applicant form for In-Game Lord Name, Current Power, Seasonal Merits, Troop Tier (T3/T4/T5), and Preferred Role (*Vanguard Fighter*, *Field Support*, *Logistics/Builder*).
> - Real-time automated merit ratio calculation and seasonal baseline comparison (EXCELLENT, QUALIFIED, REVIEW_NEEDED, UNQUALIFIED).
> - One-click transmission to officer review queue with audit logging.
> - Direct Discord webhook notification when a candidate applies.

### 3. Automated DragonStats API Sync
> **Status:** Planned  
> **Description:** Direct API polling for kingdom combat statistics to enable real-time telemetry updates without requiring manual file uploads.

### 4. Territorial War Room & Tactical Map
> **Status:** Concept Phase  
> **Description:** Interactive tactical map for pass control, beacon garrisons, and alliance territory assignment.

---

## 📋 Changelog Highlights

- **Sidebar Migration**: Replaced top navigation bar with a collapsible left sidebar and responsive mobile drawer.
- **Notification Persistence**: Extended action feedback banners and popup durations (7–9s) for improved readability.
- **Discord Webhooks Relocation**: Shifted Discord Webhook integrations out of active UI settings into `ROADMAP.md` for future platform releases.
- **Recruitment Module Archival**: Moved candidate recruitment workflow to `ROADMAP.md` for planned reintegration.
