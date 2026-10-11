"""Create one owned historical deleted fixture through current service inputs."""
import asyncio
import json
import os
from pathlib import Path
from uuid import uuid7


async def main():
    assert os.environ['POSTGRES_DB'] == 'test'
    assert os.environ['PROJECT_NAME'] == 'frontend-disposable-smoke'
    assert os.environ['POSTGRES_HOST'] == '127.0.0.1'
    assert os.environ['FOUNDATION_TASK'] == '015'
    from sqlmodel import select
    from core.deps import SessionFactory, engine
    from core.ref_id import create_ref_id
    from apps.requests.application.service import RequestService
    from apps.requests.domain.dto import BusinessRequestCreateDTO, BusinessRequestSubmitDTO
    from apps.users.domain.entity import UserEntity
    from utils.date_utils import get_datetime_utc
    accounts = json.loads(Path(os.environ['BROWSER_ACCOUNTS_FILE']).read_text())
    async with SessionFactory() as session, session.begin():
        actor = (await session.exec(select(UserEntity).where(UserEntity.username == accounts['users'][0]))).one()
        service = RequestService(session)
        row, _ = await service.create_draft(BusinessRequestCreateDTO(request_type_ref_id=accounts['request_type'], data={'amount': '42'}), actor)
        row, _ = await service.submit(create_ref_id(row.id, row.version), BusinessRequestSubmitDTO(submit_key=uuid7().hex), actor)
        # Historical fixture metadata only. There is no public request-delete command.
        # Match the backend analytics acceptance's soft-deleted-row fixture policy.
        row.deleted_at = get_datetime_utc()
        await session.flush()
    await engine.dispose()
    print(json.dumps({'historical_deleted_requests': 1, 'public_delete_command': False}))


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except Exception as error:
        print(json.dumps({'exception': type(error).__name__}))
        raise SystemExit(1)
