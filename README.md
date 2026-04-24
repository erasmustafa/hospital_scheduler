# hospital_scheduler
Smart hospital workforce scheduling system with automated shift generation, fairness optimization, and interactive calendar-based management.
# 🏥 Hospital Scheduler

Automated hospital staff scheduling platform built with Django, featuring intelligent shift allocation, workload balancing, and interactive calendar management.

---

## 🚀 Overview

Hospital Scheduler is a full-stack workforce management system designed for healthcare environments. It automates shift planning, ensures fair distribution of workload, and provides an intuitive interface for managing staff assignments.

The system is tailored for real-world hospital workflows, including night shifts, weekend duties, and department-based scheduling constraints.

---

## ⚙️ Features

- 🧠 **Automatic Shift Generation**
  - Smart scheduling based on predefined rules
  - Night shift prioritization and fairness optimization

- ⚖️ **Workload Balancing**
  - Equal distribution of night and day shifts
  - Monthly working hour tracking

- 📅 **Interactive Calendar**
  - Drag & drop shift management
  - Department and staff-based filtering
  - Real-time schedule visualization

- 🔐 **Role-Based Access**
  - Admin and department-level control
  - Approval workflows for assignments

- 🏥 **Department-Based Scheduling**
  - Prevents cross-department conflicts
  - Custom rules per unit

---

## 🏗️ Tech Stack

- Backend: :contentReference[oaicite:0]{index=0}
- Frontend: HTML, Tailwind CSS, JavaScript
- Database: SQLite / PostgreSQL
- Charts & UI: Chart.js (optional)

---

## 📊 Scheduling Logic

- 🕐 Shift Types:
  - Day Shift: 08:00 – 16:00
  - Night Shift: 08:00 – 08:00 (24h)

- 📌 Rules:
  - No work after night shift
  - Balanced distribution of night duties
  - Weekend shifts handled separately
  - Monthly hour targets considered

---

## 📂 Project Structure
