# Future Implementations

## Features Intentionally Left Outside MVP

The MVP focuses on the assignment's core mentoring flow, simple admin visibility, manual attendance, and simple feedback.

The following features should be considered after the MVP is stable.

## WhatsApp Reminders

Future version:

- Send WhatsApp reminders before scheduled meetings.
- Send WhatsApp reminders for missing attendance confirmation.
- Send WhatsApp reminders for missing feedback.
- Use an external provider such as Twilio or WhatsApp Business API.
- Keep message sending asynchronous so it does not block normal app usage.

## Attendance Confirmation Improvements

Future version:

- Automatically prompt both mentor and mentee after meeting time.
- Mark meeting as completed only after both confirm.
- Escalate disagreement when one side says the meeting happened and the other says it did not.
- Add admin resolution for disputed attendance.

## Feedback Flow Improvements

Future version:

- Separate mentor and mentee feedback forms.
- Add rating categories.
- Allow private admin-only notes.
- Remind every two days when feedback is missing.
- Send automatic thank-you message to the mentor after feedback is complete.

## Advanced Admin Dashboard

Future version:

- Statistics and graphs.
- Mentor activity trends.
- Mentee demand by topic.
- No-show rate.
- Feedback completion rate.
- Mentor appreciation leaderboard.
- Export to CSV.

## Calendar Improvements

Future version:

- Full monthly and weekly calendar.
- Drag-and-drop rescheduling.
- Google Calendar integration.
- Time zone support.
- Availability templates for mentors.

## Notification Improvements

Future version:

- Email notifications.
- In-app notification center.
- Read/unread notification states.
- Admin-configurable reminder timing.
- Background job queue for scheduled reminders.

## Deployment And Security Improvements

Future version:

- Production deployment.
- Environment-specific configs.
- Stronger rate limiting.
- Refresh tokens.
- Password reset flow.
- Email verification.
- Audit logs for admin actions.
- More complete input sanitization and monitoring.
