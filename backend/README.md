# Alan Backend

Django REST API with PostgreSQL for user accounts and curriculum content.

## Setup

1. Create PostgreSQL database:

```sql
CREATE DATABASE alan;
```

2. Apply schema and seed data (only on an **empty** database):

```bash
psql -U postgres -d alan -f sql/init.sql
```

If tables already exist, skip this step — your database is ready.

To **wipe and recreate** everything:

```bash
psql -U postgres -d alan -f sql/reset.sql
psql -U postgres -d alan -f sql/init.sql
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Copy environment file:

```bash
cp .env.example .env
```

5. Run server:

```bash
python manage.py runserver
```

API base URL: `http://localhost:8000/api`

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login/` | No | Login or register by nickname |
| GET | `/api/me/` | Yes | Current user and preferences |
| PATCH | `/api/me/` | Yes | Update language / last module |
| GET | `/api/progress/` | Yes | Lesson progress map |
| PUT | `/api/progress/<lesson_id>/` | Yes | Save lesson progress |
| GET | `/api/content/?lang=kk` | No | Full curriculum tree |

Auth header: `Authorization: Token <uuid>`

## Notes

- Database schema is managed via `sql/init.sql` (no Django migrations).
- Django models mirror the SQL tables with `managed = False` is not used — tables are created by SQL directly; Django only reads/writes them.
