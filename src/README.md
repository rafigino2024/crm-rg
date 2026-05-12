# Pipeline CRM

A mobile-responsive CRM app for managing leads, tracking pipeline stages, and automating follow-ups.

## Features

- **Pipeline Board** – Kanban-style drag-and-drop board across stages: New, Contacted, Qualified, Negotiation, Proposal, Won, Lost
- **List View** – Sortable, searchable table view of all leads
- **Lead Profiles** – Full lead details including contact info, priority, lead source, estimated value, tags, follow-up dates, and notes
- **Lead Source Tracking** – Track where leads come from: Website, Referral, Social Media, Cold Outreach, Event, Paid Ads, Partner, or Other
- **Tasks** – Per-lead task management with due dates and status tracking
- **Activity History** – Automatic log of stage changes and field updates per lead
- **Email Templates** – Create reusable email templates per pipeline stage
- **Auto Email Prompts** – When a lead's stage changes, the app automatically suggests sending the matching email template
- **Follow-Up Alerts** – Dashboard widget highlighting leads due for follow-up today or overdue
- **Pending Tasks Widget** – Dashboard widget showing open tasks with overdue indicators
- **Calendar View** – Visual calendar showing leads by follow-up or next action date
- **Bulk Actions** – Select multiple leads and bulk-change stage or delete
- **CSV Import / Export** – Import leads from CSV or export the current view
- **Priority Filtering** – Filter leads by High / Medium / Low priority
- **Tag Filtering** – Label leads with custom tags and filter by them
- **Owner Filtering** – Filter leads by assigned team member
- **Pipeline Value Summary** – Shows total estimated value of active pipeline leads
- **Conversion Summary** – Tracks win/loss rates across the pipeline
- **Stage Chart** – Bar chart breakdown of leads by stage
- **Dark Mode** – Automatically follows system color scheme preference
- **Pull to Refresh** – Mobile pull-to-refresh on the dashboard

## Tech Stack

- React + Vite
- Tailwind CSS + shadcn/ui
- Framer Motion (animations)
- @hello-pangea/dnd (drag and drop)
- @tanstack/react-query (data fetching)
- Recharts (charts)
- Base44 (backend, auth, database, integrations)

## Pages

| Route | Description |
|---|---|
| `/` | Main dashboard with pipeline board, widgets, and filters |
| `/email-templates` | Manage reusable email templates |
| `/activity` | Activity summary log across all leads |
| `/settings` | App settings |

## Lead Stages

New → Contacted → Qualified → Negotiation → Proposal → **Won** / **Lost**

## Getting Started

This app is built on the [Base44](https://base44.com) platform. Open the app in the Base44 editor to configure, customize, and publish.