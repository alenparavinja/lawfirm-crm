# Path to Production

This document describes how to take the proof of concept toward a production deployment. The application is built with good structural bones but is deliberately not hardened for production, because a proof of concept does not need that hardening and building it prematurely would obscure the parts of the project that are worth demonstrating. Each section below names a deliberate scoping decision, explains why it is acceptable for the proof of concept, and describes where a forker would add the production version.

The intent is that none of these require ripping out existing structure. The seams are already in place; this is a list of what plugs into them.

## Authentication coverage

Authentication is currently applied per route file rather than centrally. Each router that needs protection includes the requireAuth middleware itself. This works, but it depends on every new router remembering to add it, and a router that forgets is silently unauthenticated. This pattern was the cause of a real bug during development: the notes router was read-only and had no auth, so when write routes were added, the authenticated user was not available and note creation failed.

For production, authentication should be applied once at the mount point rather than scattered per route. Mounting protected routers behind a single middleware (for example app.use('/api', requireAuth) with the login route mounted before it, or requireAuth passed at each app.use for protected routers) makes coverage structural rather than per-file discipline. The middleware already exists and already attaches the authenticated staff id to the request; the change is where it is applied, not how it works.

## Token handling

The API issues a JWT valid for 24 hours with no refresh token. The frontend stores it in localStorage and attaches it to requests through an Axios interceptor. This is simple and works for a single-session demo, but localStorage is readable by any script running on the page, which makes it vulnerable to token theft through cross-site scripting.

A production deployment should move the token to an httpOnly cookie so client-side scripts cannot read it, add refresh-token rotation so sessions can be extended without re-login and revoked when needed, add rate limiting and lockout on the login route to slow credential-stuffing, and add a password reset flow. The login response and the interceptor layer are the only places that would change on the frontend.

## Authorization

Authentication answers who the user is; authorization answers what they may do. The application currently has no authorization: any authenticated staff member can perform any action on any record. The staff role field (attorney, paralegal, admin) exists in the data model but is not enforced anywhere.

For production, role-based access control would gate actions by role, and likely add record-level rules so that staff see and modify the cases they are assigned to rather than every case in the firm. The role is already on the authenticated request via the token, so enforcement is a matter of adding checks in the route or controller layer, not adding new data.

## Audit logging

There is no audit trail. The system does not record who viewed, created, edited, or deleted which record, or when. For a generic CRM this is a nice-to-have; for a law firm handling immigration matters it is closer to a requirement, both for internal accountability and because legal practice often carries record-keeping obligations.

A production deployment would log every write (and possibly every read of sensitive records) with the acting user, the affected record, the action, and a timestamp, stored separately from the records themselves so the log cannot be altered through the same paths as the data. The authenticated user is already available on every request, which is the main input an audit layer needs.

## Soft delete

Delete is currently a hard delete across every entity: the record is removed from the database with no recovery. For a legal records system this is the wrong default. Client and case records carry retention obligations, and an accidental or malicious deletion should be recoverable and visible in the audit trail rather than silent and permanent.

The production version is soft delete: a deleted flag or a status value that marks a record inactive while preserving it, with list queries filtered to exclude soft-deleted records by default. The status field on clients and cases is a natural place to carry this. This change touches the delete controllers (mark rather than remove) and the list queries (filter the marked records out), and pairs naturally with the audit logging above.

## Reference dropdowns at scale

Forms that reference another entity (a case referencing a client and a staff member, a task referencing a staff member) populate their dropdowns by loading the full list of candidates and filtering client-side. At the proof of concept's seed volumes this is fine and keeps the dropdowns instant. At real scale, loading every client into a form to pick one does not hold.

The production version is server-side search: the dropdown queries the API as the user types, returning a bounded set of matches rather than the whole collection. The searchable dropdown component already debounces and filters; the change is pointing it at a search endpoint instead of an in-memory list, and adding that endpoint on the backend.

## New staff credentials

The staff create form does not set a login password. A staff member created through the application has a record but no way to log in until a password is set through another path. For the proof of concept, logins come from the seeded development accounts, so this gap does not surface.

A production deployment would handle credential provisioning when a staff member is created: an invite flow that emails a set-password link, or an admin-set temporary password forced to change on first login. This is the same surface as the password reset flow noted under token handling and would share most of its machinery.

## Query cache namespacing

The frontend keys its React Query caches by entity name, with list queries and single-record detail queries sharing the same top-level key (for example the staff list and a single staff member both live under a staff key). Broad cache invalidation after a write therefore matches both, which during development caused a deleted record's detail query to refetch and return a not-found error. The symptom was cosmetic and was worked around, but the underlying sharing is worth tightening.

The cleaner pattern namespaces list and detail caches distinctly (for example a list namespace and a detail namespace under each entity) so that invalidating one does not touch the other. This is a frontend-only change to the query keys in the hooks.

## Infrastructure

The infrastructure is scoped for a proof of concept in several deliberate ways, each documented in ARCHITECTURE.md. Everything runs in a single Availability Zone; the database is self-hosted on EC2 rather than managed; and the whole stack is designed to be destroyed between work sessions to avoid the NAT Gateway's running cost.

A production deployment would span multiple Availability Zones with the application behind a load balancer and the database replicated across zones, move the database to a managed service with automated backups and point-in-time recovery, run continuously rather than being torn down, and add observability: error monitoring, structured request logging, health and readiness probes, and alerting. Replacing the Bastion with AWS Systems Manager Session Manager would also remove the public SSH surface entirely. None of these change the application code; they are infrastructure and operations work that the Terraform configuration is structured to grow into.
