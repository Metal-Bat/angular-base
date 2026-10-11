"""Owned paired acceptance actions through existing backend service/outbox owners."""
import asyncio
import json
import os
from pathlib import Path
import sys
from uuid import uuid7

async def main():
    assert os.environ['POSTGRES_DB'] == 'test' and os.environ['PROJECT_NAME'] == 'frontend-disposable-smoke'
    from sqlmodel import select
    from core.deps import SessionFactory, engine
    from core.ref_id import create_ref_id
    from core.celery_app import celery_app
    from apps.users.domain.entity import UserEntity
    from apps.notifications.application.events import stage_notice
    from apps.tasks.application.outbox import dispatch_outbox
    from apps.tasks.tasks import push_inbox_notification
    accounts=json.loads(Path(os.environ['BROWSER_ACCOUNTS_FILE']).read_text())
    state=Path(os.environ['NOTIFICATION_STATE_FILE'])
    action=sys.argv[1]
    if action=='cleanup':
        from apps.notifications.data.live import signal_client
        async with signal_client() as cache:
            for _ in range(80):
                if await cache.zcard('inbox-live:connections')==0: break
                await asyncio.sleep(.1)
            assert await cache.zcard('inbox-live:connections')==0
    elif action=='duplicate':
        push_inbox_notification.apply_async(kwargs={'notification_id':state.read_text()})
    elif action=='task':
        from apps.requests.application.service import RequestService
        from apps.requests.domain.dto import BusinessRequestCreateDTO,BusinessRequestSubmitDTO
        async with SessionFactory() as session,session.begin():
            actor=(await session.exec(select(UserEntity).where(UserEntity.username==accounts['users'][0]))).one()
            service=RequestService(session)
            row,_=await service.create_draft(BusinessRequestCreateDTO(request_type_ref_id=accounts['request_type'],data={'amount':'42'}),actor)
            await service.submit(create_ref_id(row.id,row.version),BusinessRequestSubmitDTO(submit_key=uuid7().hex),actor)
    else:
        async with SessionFactory() as session,session.begin():
            actor=(await session.exec(select(UserEntity).where(UserEntity.username==accounts['users'][1]))).one()
            row=await stage_notice(session,map_id='MAP-14',event_id=uuid7(),recipient_id=actor.id,target_kind='account',target_id=actor.id)
            assert row is not None
            state.write_text(str(row.id))
    # The real Celery worker creates fanout successors. Dispatch until all committed
    # push intents have been handed to it, without directly publishing Redis signals.
    for _ in range(30):
        await dispatch_outbox(celery_app)
        await asyncio.sleep(.1)
    await engine.dispose()

try:
    asyncio.run(main())
except Exception as error:
    import traceback
    locations=[{'file':Path(frame.filename).name,'line':frame.lineno,'function':frame.name} for frame in traceback.extract_tb(error.__traceback__)[-5:]]
    print(json.dumps({'exception':type(error).__name__,'locations':locations}),file=sys.stderr)
    raise SystemExit(1)
