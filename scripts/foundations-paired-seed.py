"""Extend only the owned disposable browser fixture; never touch a peer seed."""
import asyncio
import json
import os
from pathlib import Path
from uuid import uuid7

async def main():
    assert os.environ['POSTGRES_DB'] == 'test'
    assert os.environ['PROJECT_NAME'] == 'frontend-disposable-smoke'
    from sqlmodel import select
    from apps.users.domain.help_entity import HelpStateEntity
    from datetime import UTC, datetime
    from apps.users.domain.personal_entity import PersonalItemEntity
    from apps.users.domain.entity import UserEntity
    from apps.users.domain.auth_entity import PermissionEntity, RoleEntity, RolePermissionEntity, UserRoleEntity
    from apps.forms.domain.entity import FormDefinitionEntity
    from apps.clients.domain.entity import ClientEntity, ClientReleaseEntity
    from core.deps import SessionFactory, engine
    accounts_path = Path(os.environ['BROWSER_ACCOUNTS_FILE'])
    accounts = json.loads(accounts_path.read_text())
    async with SessionFactory() as session, session.begin():
        actor = (await session.exec(select(UserEntity).where(UserEntity.username == accounts['users'][0]))).one()
        historical_seen = datetime.now(UTC)
        session.add(HelpStateEntity(user_id=actor.id, help_key='requests.start', revision='0', locale='en', first_viewed_at=historical_seen, last_viewed_at=historical_seen))
        legacy = {"schema_version": 0, "resource_kind": "business_requests", "name": "Owned legacy restricted view", "command_key": "owned-legacy", "query": {"scope": "mine", "filters": [{"field_name": "obsolete_restriction", "operation": "equal", "value": "owned-only"}], "sort_orders": []}, "column_keys": ["status"], "page_size": 35}
        session.add(PersonalItemEntity(user_id=actor.id, kind="view", scope="business_requests", name=legacy["name"], document={"creation": legacy, "current": legacy}))
        session.add(FormDefinitionEntity(code=f'owned-form-{uuid7().hex}', name='Owned favorite form', owner_user_id=actor.id))
        for index in range(25):
            client = ClientEntity(code=f'owned-picker-{uuid7().hex}', name=f'Owned picker client {index:02}', kind='WEB', platform='owned-browser-test')
            session.add(client)
            await session.flush()
            if index == 24:
                session.add(ClientReleaseEntity(client_id=client.id, release_version='1.0.0', api_version='1', renderer_capabilities=[]))
        role = RoleEntity(name=f'owned-foundation-author-{uuid7()}')
        session.add(role)
        await session.flush()
        for name in ['forms.manage', 'workflows.manage']:
            permission = (await session.exec(select(PermissionEntity).where(PermissionEntity.name == name))).one_or_none()
            if permission is None:
                permission = PermissionEntity(name=name)
                session.add(permission)
                await session.flush()
            session.add(RolePermissionEntity(role_id=role.id, permission_id=permission.id))
        session.add(UserRoleEntity(user_id=actor.id, role_id=role.id))
        operator = UserEntity(username=f'owned-operator-{uuid7()}', hashed_password=actor.hashed_password, is_superuser=True)
        session.add(operator)
        accounts['users'].append(operator.username)
    accounts_path.write_text(json.dumps(accounts))
    accounts_path.chmod(0o600)
    await engine.dispose()

if __name__ == '__main__':
    asyncio.run(main())
