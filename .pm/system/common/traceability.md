# System to Service Requirements Traceability Matrix

## Overview
This document maps system-level requirements to service-level requirements for traceability.

## Traceability Matrix

| System Requirement ID | Title | Tier | Linked Services (SVC IDs) |
|----------------------|-------|------|---------------------------|
| SYS-FUNC-001 | User registration with email/password | MVP | SVC-users-FUNC-001 (MBE Verified: TC-MBE-1.2, TC-MBE-1.3) (INT Verified: TC-INT-1.2) |
| SYS-FUNC-002 | JWT authentication | MVP | SVC-users-FUNC-002 (FE Verified: TC-FE-1.5, TC-FE-7.2) (MBE Verified: TC-MBE-1.4, TC-MBE-1.5) (INT Verified: TC-INT-1.3, TC-INT-1.4) |
| SYS-FUNC-003 | Password reset via email | MVP | SVC-users-FUNC-003, SVC-notifications-FUNC-001 |
| SYS-FUNC-004 | User profiles with display names | MVP | SVC-users-FUNC-004 |
| SYS-FUNC-005 | Create multiple households | MVP | SVC-users-FUNC-005 (MBE Verified: TC-MBE-2.3) (INT Verified: TC-INT-2.3) |
| SYS-FUNC-006 | Users belong to multiple households | MVP | SVC-users-FUNC-006 (MBE Verified: TC-MBE-2.2) (INT Verified: TC-INT-2.2) |
| SYS-FUNC-007 | Three role levels | MVP | SVC-users-FUNC-007 |
| SYS-FUNC-008 | Invite members via email | MVP | SVC-users-FUNC-008, SVC-notifications-FUNC-002 (MBE Verified: TC-MBE-2.5, TC-MBE-2.6) (INT Verified: TC-INT-2.4) |
| SYS-FUNC-009 | Household activity logs | MVP | SVC-users-FUNC-009, SVC-inventory-FUNC-001 |
| SYS-FUNC-010 | Add inventory items | MVP | SVC-inventory-FUNC-002 (FE Verified: TC-FE-3.1, TC-FE-3.2) (MBE Verified: TC-MBE-3.3) |
| SYS-FUNC-011 | Track use by and best before dates | MVP | SVC-inventory-FUNC-003 |
| SYS-FUNC-012 | Edit item details | MVP | SVC-inventory-FUNC-004 (FE Verified: TC-FE-3.3, TC-FE-3.4) |
| SYS-FUNC-013 | Mark items as consumed | MVP | SVC-inventory-FUNC-005 (FE Verified: TC-FE-3.5, TC-FE-7.3) (MBE Verified: TC-MBE-3.6) |
| SYS-FUNC-014 | Mark items as wasted | MVP | SVC-inventory-FUNC-006 (FE Verified: TC-FE-3.6, TC-FE-7.3) (MBE Verified: TC-MBE-3.7) |
| SYS-FUNC-015 | Move items between locations | MVP | SVC-inventory-FUNC-007 |
| SYS-FUNC-016 | Calculate days until expiration | MVP | SVC-inventory-FUNC-008 (MBE Verified: TC-MBE-3.2) |
| SYS-FUNC-017 | Categorize items | MVP | SVC-inventory-FUNC-009 (FE Verified - Reports: TC-FE-6.1, TC-FE-7.8) |
| SYS-FUNC-018 | Send expiration warnings | MVP | SVC-inventory-FUNC-010, SVC-notifications-FUNC-003 |
| SYS-FUNC-019 | Customize warning period | MVP | SVC-notifications-FUNC-004 (FE Verified - Search: TC-FE-6.4) (MBE Verified: TC-MBE-4.5) |
| SYS-FUNC-020 | Email notifications | MVP | SVC-notifications-FUNC-005 (FE Verified - Filter: TC-FE-6.5, TC-FE-6.6) |
| SYS-FUNC-021 | In-app notifications | MVP | SVC-notifications-FUNC-006 (FE Verified: TC-FE-4.1, TC-FE-4.2, TC-FE-7.7) |
| SYS-FUNC-022 | Telegram bot notifications | MVP | SVC-notifications-FUNC-007 |
| SYS-FUNC-023 | Link Telegram accounts | MVP | SVC-notifications-FUNC-008 (FE Verified: TC-FE-4.4, TC-FE-7.4) (MBE Verified: TC-MBE-4.6) |
| SYS-FUNC-024 | Shared shopping lists | MVP | SVC-inventory-FUNC-011 (FE Verified: TC-FE-5.1, TC-FE-5.2) (MBE Verified: TC-MBE-5.1, TC-MBE-5.2) |
| SYS-FUNC-025 | Real-time shopping list sync | MVP | SVC-inventory-FUNC-012 (FE Verified: TC-FE-5.3, TC-FE-5.5, TC-FE-7.5) (MBE Verified: TC-MBE-5.5, TC-MBE-5.6) |
| SYS-FUNC-026 | Add inventory to shopping list | MVP | SVC-inventory-FUNC-013 |
| SYS-FUNC-027 | Real-time updates | MVP | SVC-inventory-FUNC-014 (FE Verified: TC-FE-3.7, TC-FE-4.3) (MBE Verified: TC-MBE-4.3) |
| SYS-FUNC-028 | Concurrent update handling | MVP | SVC-inventory-FUNC-015 (FE Verified: TC-FE-3.9) |
| SYS-SEC-001 | Hash passwords with bcrypt | MVP | SVC-users-SEC-001 |
| SYS-SEC-002 | HTTPS communications | MVP | All services |
| SYS-SEC-003 | JWT token expiration | MVP | SVC-users-SEC-002 |
| SYS-SEC-004 | CORS protection | MVP | All services |
| SYS-SEC-005 | Input validation | MVP | All services |
| SYS-SEC-006 | Rate limiting | MVP | All services |
| SYS-SEC-007* | Tenant data isolation | MVP | SVC-users-SEC-003, SVC-inventory-SEC-001 |
| SYS-PRIV-001 | No cross-tenant data sharing | MVP | All services |
| SYS-PRIV-002 | Account deletion | MVP | SVC-users-PRIV-001 |
| SYS-PRIV-003 | Anonymize deleted user data | MVP | SVC-users-PRIV-002 |
| SYS-PERF-001 | 200ms API response time | MVP | All services |
| SYS-PERF-002 | 100 concurrent users per household | MVP | SVC-inventory-PERF-001 |
| SYS-PERF-003 | 1000 items per household | MVP | SVC-inventory-PERF-002 |
| SYS-PERF-004 | 1 second real-time propagation | MVP | SVC-inventory-PERF-003 |
| SYS-PORT-001 | System MUST run in Docker containers | MVP | All services (FE Verified: TC-FE-1.1) |
| SYS-PORT-002 | Frontend MUST work as Progressive Web App | MVP | Frontend service (FE Verified - PWA & Mobile: TC-FE-6.7, TC-FE-6.8, TC-FE-6.9) |
| SYS-PORT-003 | System MUST support PostgreSQL 14+ | MVP | SVC-inventory, SVC-users |

## Service Dependencies

### Users Service
- Depends on: Notifications Service (for email sending)
- Provides to: Inventory Service (authentication, authorization)

### Inventory Service  
- Depends on: Users Service (authentication), Notifications Service (alerts)
- Provides to: Frontend applications

### Notifications Service
- Depends on: External services (SMTP, Telegram API)
- Provides to: Users Service, Inventory Service