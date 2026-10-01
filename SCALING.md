# Scaling and Database Limitations

## SQLite Limitations
This project currently uses SQLite via Prisma. SQLite is a lightweight, file-based database, which means it has concurrent write limitations.

To mitigate "database is locked" (BusyError) issues:
1. **WAL Mode**: Prisma enables Write-Ahead Logging (WAL) by default.
2. **Connection Limit**: We enforce `connection_limit=1` in `.env` to serialize writes.
3. **socket_timeout**: We enforce `socket_timeout=5` to prevent stale locks.
4. **PM2 Instances**: We enforce `instances: 1` in `ecosystem.config.js`. Do not run in cluster mode with SQLite.

## Migrating to PostgreSQL
For a true production environment serving >50 simultaneous users, migrate to PostgreSQL:
1. Update `prisma/schema.prisma` provider to `postgresql`.
2. Change `DATABASE_URL` in `.env` to your PostgreSQL connection string.
3. Run `npx prisma migrate dev` to initialize the database.
4. Remove `connection_limit=1` constraint from the connection string.
5. You can now safely increase PM2 instances to `max` for cluster mode load balancing.
