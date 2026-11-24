bloodgroup/
├── prisma/schema.prisma        ← your database design
├── lib/
│   ├── prisma.ts               ← database connection
│   └── auth.ts                 ← token helper
└── app/api/v1/
    ├── register/route.ts
    ├── login/route.ts
    ├── sendOTP/route.ts
    ├── verifyOTP/route.ts
    ├── guestUser/route.ts
    ├── feed/route.ts           ← GET list, POST create post
    ├── feed/[id]/route.ts      ← PUT update, DELETE
    └── comment/route.ts

    API	Result
guestUser	guest token
register	user created, token returned
login	isRegistered check
sendOTP / verifyOTP	OTP printed in terminal, token returned
POST feed	post created with blood groups
GET feed q=Donor	posts listed with blood group filter
GET feed q=Receiver	donors listed with blood group filter
POST comment	comment added to post
PUT feed/1	title updated
DELETE feed/1	post deleted


# Blood Donation Backend

Next.js route handlers + Prisma + PostgreSQL.

## Auth
Send the token on every request except the auth endpoints:
`Authorization: Bearer <token>`

Blood groups: `A_POS, A_NEG, B_POS, B_NEG, O_POS, O_NEG`

All endpoints start with `/api/v1`.

## Auth endpoints
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | /guestUser | none | `{ token }` (guest, view only) |
| POST | /register | `name, dob, bloodGroup, mobile, email, privacyConsent (true)` | `{ token }` |
| POST | /login | `{ identifier }` (mobile or email) | `{ isRegistered }` |
| POST | /sendOTP | `{ identifier }` | `{ message }` |
| POST | /verifyOTP | `{ identifier, code }` | `{ token }` |
| GET | /me | none | logged-in user profile (or `{ role: "guest" }`) |

## Feed
| Method | Path | Notes |
|---|---|---|
| GET | /feed?q=Donor&bloodGroup=A_POS,O_POS&page=1&pagination=10 | Patient posts (not expired). Guest or user |
| GET | /feed?q=Receiver&bloodGroup=O_POS&page=1&pagination=10 | Donors who gave consent. Guest or user |
| POST | /feed | User only. Body: `title, description, mobile, bloodRequired[], expiryTime` |
| PUT | /feed/:id | Owner only. Any of the POST fields |
| DELETE | /feed/:id | Owner only |

## Comments
| Method | Path | Notes |
|---|---|---|
| POST | /comment?post_id=1 | User only. Body: `{ description }` |
| DELETE | /comment/:id | Owner only |

## Errors
`400` invalid input, `401` missing or invalid token, `403` not the owner, `404` not found, `409` already registered.

## Run locally
```
npm install
# create .env with DATABASE_URL and JWT_SECRET
npx prisma migrate dev
npm run dev
```