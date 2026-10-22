"""Read only owned cancellation evidence unavailable after public source deletion."""
import asyncio
import json
import os
import sys
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
    if sys.argv[1:] == ['deadline']:
        from apps.requests.domain.entity import BusinessRequestEntity
        from apps.work_items.domain.entity import WorkItemEntity
        from core.ref_id import open_ref_id
        request_type_id, _ = open_ref_id(accounts['request_type'])
        async with SessionFactory() as session:
            reviewer = (await session.exec(select(UserEntity).where(UserEntity.username == accounts['users'][1]))).one()
            item = (await session.exec(select(WorkItemEntity).join(BusinessRequestEntity, WorkItemEntity.business_request_id == BusinessRequestEntity.id).where(BusinessRequestEntity.request_type_id == request_type_id))).one()
            assert item.status == 'COMPLETED' and item.due_at is not None
            rows = (await session.exec(select(CalendarReminderEntity).where(CalendarReminderEntity.source_kind == 'work_item', CalendarReminderEntity.source_id == item.id, CalendarReminderEntity.recipient_id == reviewer.id))).all()
            assert len(rows) == 1 and rows[0].status == 'CANCELLED'
        await engine.dispose()
        print(json.dumps({'completed':True,'cancelled':1,'pending':0}))
        return
    assert sys.argv[1:] in ([], ['cancelled'])
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
