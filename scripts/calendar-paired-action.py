"""Read only owned cancellation evidence unavailable after public source deletion."""
import asyncio
import json
import os
from pathlib import Path


async def main():
    assert os.environ['POSTGRES_DB'] == 'test'
    assert os.environ['PROJECT_NAME'] == 'frontend-disposable-smoke'
    assert os.environ['POSTGRES_HOST'] == '127.0.0.1'
    assert os.environ['FOUNDATION_TASK'] == '014'
    from sqlmodel import select
    from core.deps import SessionFactory, engine
    from apps.calendar.domain.entity import CalendarEventEntity
    from apps.calendar.domain.reminder import CalendarReminderEntity
    from apps.users.domain.entity import UserEntity
    accounts = json.loads(Path(os.environ['BROWSER_ACCOUNTS_FILE']).read_text())
    async with SessionFactory() as session:
        actor = (await session.exec(select(UserEntity).where(UserEntity.username == accounts['users'][0]))).one()
        event = (await session.exec(select(CalendarEventEntity).where(CalendarEventEntity.owner_id == actor.id, CalendarEventEntity.title == 'Owned cancelled reminders'))).one()
        rows = (await session.exec(select(CalendarReminderEntity).where(CalendarReminderEntity.source_id == event.id))).all()
        assert event.deleted_at is not None and len(rows) == 1
        assert all(row.status == 'CANCELLED' for row in rows)
    await engine.dispose()
    print(json.dumps({'source_deleted': True, 'cancelled': len(rows), 'pending': 0}))


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except Exception as error:
        print(json.dumps({'exception': type(error).__name__}))
        raise SystemExit(1)
