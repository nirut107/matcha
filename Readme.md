
##
matcha/
├── frontend/                # Next.js
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── reset-password/
│   │   │
│   │   ├── profile/
│   │   ├── browse/
│   │   ├── search/
│   │   ├── chat/
│   │   ├── notifications/
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── profile/
│   │   ├── chat/
│   │   └── common/
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   ├── socket.ts
│   │   └── auth.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useSocket.ts
│   │   └── useProfile.ts
│   │
│   ├── store/              # (optional Zustand)
│   ├── styles/
│   └── public/
│
├── backend/                # NestJS
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── user/
│   │   │   ├── profile/
│   │   │   ├── match/
│   │   │   ├── chat/
│   │   │   ├── notification/
│   │   │   └── search/
│   │
│   │   ├── common/
│   │   │   ├── guards/
│   │   │   ├── filters/
│   │   │   ├── interceptors/
│   │   │   └── decorators/
│   │
│   │   ├── database/
│   │   │   ├── prisma/
│   │   │   └── migrations/
│   │
│   │   ├── sockets/
│   │   │   ├── chat.gateway.ts
│   │   │   └── notification.gateway.ts
│   │
│   │   └── utils/
│   │
│   ├── uploads/            # เก็บรูป (ไม่ต้อง sudo)
│   ├── .env
│   └── package.json
│
├── database/
│   ├── init.sql
│   └── seed.ts
│
├── docker/ (optional ไม่ใช้ sudo ก็ยังใช้ได้ถ้า rootless)
│   ├── docker-compose.yml
│   └── postgres/
│
├── scripts/
│   ├── start.sh
│   └── seed.sh
│
├── .env
└── README.md3