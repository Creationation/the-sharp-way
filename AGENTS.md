# Architecture
- Admin recurring appointments are materialized as ordinary bookings by an admin-only atomic RPC, with a series UUID for deduplication; existing calendar and reminder flows must see each occurrence.
- Admin start/end times are converted to the existing service_duration in minutes; public booking slot rules stay unchanged.
- Use the shared recurrence controls and rrule date generator for both admin appointment forms.