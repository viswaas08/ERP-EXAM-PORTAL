# API Documentation

Base URL: `/api`

## Authentication

`POST /auth/login`

Body:

```json
{ "email": "admin@exam.gov", "password": "Password@123" }
```

Returns user profile, access token, and refresh token.

## Dashboard

`GET /dashboard/summary`

Returns counts for examinations, candidates, applications, approval status, hall tickets, and results.

## Examinations

- `GET /examinations?search=&status=`
- `POST /examinations`
- `POST /examinations/:id/clone`

## Applications

- `GET /applications?status=&search=&page=&limit=`
- `PATCH /applications/:id/status`
- `GET /applications/:id/acknowledgement.pdf`

## Eligibility Rules

- `GET /eligibility-rules?examId=`
- `POST /eligibility-rules/:examId/simulate`

## Documents, Hall Tickets, Results

- `GET /hall-tickets/:id.pdf`
- `GET /results/:id/score-card.pdf`

## Audit and Notifications

- `GET /audit-logs`
- `GET /notifications`
