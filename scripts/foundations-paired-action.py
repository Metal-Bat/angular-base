"""Tick actual scheduler/outbox owners only inside the owned disposable harness."""
import asyncio
import json
import os
from pathlib import Path
from uuid import uuid7


async def main():
    assert os.environ['POSTGRES_DB'] == 'test'
    assert os.environ['PROJECT_NAME'] == 'frontend-disposable-smoke'
    from sqlmodel import select
    from core.deps import SessionFactory, engine
    from core.celery_app import celery_app
    from core.celery_scheduler import _claim_leader, _enqueue_due, _release_leader
    from apps.tasks.application.outbox import dispatch_outbox
    from apps.calendar.domain.entity import CalendarEventEntity
    from apps.calendar.domain.reminder import CalendarReminderEntity
    from apps.users.domain.entity import UserEntity
    accounts = json.loads(Path(os.environ['BROWSER_ACCOUNTS_FILE']).read_text())
    owner = uuid7()
    assert await _claim_leader(owner)
    try:
        await _enqueue_due(owner, celery_app)
    finally:
        await _release_leader(owner)
    for _ in range(80):
        await dispatch_outbox(celery_app)
        async with SessionFactory() as session:
            actor = (await session.exec(select(UserEntity).where(UserEntity.username == accounts['users'][0]))).one()
            event = (await session.exec(select(CalendarEventEntity).where(CalendarEventEntity.owner_id == actor.id, CalendarEventEntity.title == 'Owned worker reminder'))).one()
            rows = (await session.exec(select(CalendarReminderEntity).where(CalendarReminderEntity.source_id == event.id))).all()
            if len(rows) == 1 and rows[0].status == 'SENT':
                break
        await asyncio.sleep(.1)
    else:
        raise RuntimeError('Real reminder worker did not settle')
    # Flush notification fanout successors, without publishing a synthetic Redis signal.
    for _ in range(30):
        await dispatch_outbox(celery_app)
        await asyncio.sleep(.1)
    await engine.dispose()
    print(json.dumps({'scheduler': 'real_clocked_tick', 'worker': 'SENT', 'reminders': len(rows)}))


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except Exception as error:
        print(json.dumps({'exception': type(error).__name__}))
        raise SystemExit(1)
