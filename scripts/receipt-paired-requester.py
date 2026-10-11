"""Enable only the existing requester in the guarded owned receipt fixture."""
import asyncio
import json
import os
import re
import sys
from pathlib import Path

async def main():
    database = os.environ.get('POSTGRES_DB', '')
    if not re.fullmatch(r'bpms_flow_[a-f0-9]{32}', database) or database != os.environ.get('FLOW_TEST_OWNED_DATABASE'):
        raise RuntimeError('An exact disposable owned database is required')
    accounts_path = Path(sys.argv[1])
    if accounts_path.stat().st_mode & 0o077:
        raise RuntimeError('Private fixture credentials required')
    accounts = json.loads(accounts_path.read_text())
    reviewer = accounts['users'][0]
    if not re.fullmatch(r'order-reviewer-[a-f0-9]+', reviewer):
        raise RuntimeError('Expected existing receipt fixture reviewer')
    username = reviewer.replace('order-reviewer-', 'order-publisher-', 1)
    from sqlmodel import select
    from apps.users.domain.entity import UserEntity
    from apps.requests.domain.entity import BusinessRequestEntity
    from apps.users.application.preferences import PersonalSettingsService
    from apps.users.domain.preferences import PreferencesPatch
    from core.deps import SessionFactory, engine
    from core.history import audit_context
    from utils.security import hash_password
    try:
        with audit_context():
            async with SessionFactory() as session:
                actor = (await session.exec(select(UserEntity).where(UserEntity.username == username))).one()
                rows = (await session.exec(select(BusinessRequestEntity).where(BusinessRequestEntity.requester_user_id == actor.id))).all()
                if len(rows) != 1:
                    raise RuntimeError('Exactly one owned receipt request required')
                actor.hashed_password = await hash_password(accounts['password'])
                personal = PersonalSettingsService(session)
                current = await personal.read(actor)
                await personal.apply(actor, PreferencesPatch(ref_id=current.ref_id, locale={'language': accounts['language']}))
                await session.commit()
        result = Path(sys.argv[2])
        with result.open('x') as output:
            result.chmod(0o600)
            json.dump({'username': username}, output)
    finally:
        await engine.dispose()

if __name__ == '__main__':
    asyncio.run(main())
