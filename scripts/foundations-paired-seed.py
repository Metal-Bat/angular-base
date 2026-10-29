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
        if os.environ.get('FOUNDATION_TASK') == '014':
            from apps.work_groups.domain.entity import WorkGroupEntity, WorkGroupMemberEntity
            from core.ref_id import create_ref_id
            own = WorkGroupEntity(code='CG' + uuid7().hex, name='Owned Calendar Team')
            foreign = WorkGroupEntity(code='CG' + uuid7().hex, name='Foreign Calendar Team')
            session.add_all([own, foreign])
            await session.flush()
            session.add(WorkGroupMemberEntity(work_group_id=own.id, user_id=actor.id, added_by_user_id=actor.id))
            accounts['calendar_group'] = create_ref_id(own.id, own.version)
        if os.environ.get('FOUNDATION_TASK') == '021':
            # Publish only reviewed pure primitives in this owned disposable DB.
            # Existing applied migrations and published snapshots stay immutable.
            from apps.step_types.application.registry import get_registry
            from apps.step_types.application.service import StepTypeService
            from core.ref_id import create_ref_id
            step_types = StepTypeService(session, get_registry())
            reviewed = {'arithmetic', 'number_compare', 'boolean_logic', 'if_else', 'select_value'}
            for version in await step_types.reconcile():
                if version.handler_key in reviewed and version.status == 'DRAFT':
                    await step_types.publish(create_ref_id(version.id, version.version))
        if os.environ.get('FOUNDATION_TASK') == '030':
            # Controlled metadata in this owned database only. No credential is
            # resolved and this seed does not establish vendor verification.
            from apps.integrations.domain.entity import IntegrationConnectionEntity
            from core.ref_id import create_ref_id
            connection = IntegrationConnectionEntity(
                code=f'owned_agent_{uuid7().hex}', name='Owned agent connection',
                provider='typesafe', kind='AI', owner_user_id=actor.id,
                verification_status='VERIFIED', status='ACTIVE',
                non_secret_config={'endpoint_key': 'hosted', 'models': ['owned-model'],
                                   'provider_retention': 'Owned acceptance metadata only'},
                secret_ref='owned_unresolved', secret_version='1',
            )
            session.add(connection)
            await session.flush()
            accounts['agent_connection'] = create_ref_id(connection.id, connection.version)
            import importlib.util
            spec = importlib.util.spec_from_file_location('owned_agent_authoring', Path(__file__).with_name('agent-authoring-paired-seed.py'))
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            try:
                await module.seed_agent_authoring(session, actor, connection, accounts)
            except Exception as error:
                import traceback
                safe = {'error_type': type(error).__name__, 'frames': [{'file': Path(frame.filename).name, 'function': frame.name, 'line': frame.lineno} for frame in traceback.extract_tb(error.__traceback__)]}
                if hasattr(error, 'issues'):
                    safe['issues'] = [{'pointer': item.get('pointer'), 'code': item.get('code')} for item in error.issues]
                target = Path(__file__).resolve().parents[1] / 'artifacts/integration-2026-10-28/agent-seed-failure.json'
                if hasattr(error, 'errors'):
                    safe['validation'] = [{'path': list(item['loc']), 'code': item['type']} for item in error.errors(include_input=False, include_url=False, include_context=False)]
                target.parent.mkdir(parents=True, exist_ok=True)
                target.with_name('agent-seed-failure-' + uuid7().hex + '.json').write_text(json.dumps(safe, indent=2)+'\n')
                target.write_text(json.dumps(safe, indent=2)+'\n')
                raise
            outsider = (await session.exec(select(UserEntity).where(UserEntity.username == accounts['users'][1]))).one()
            session.add(UserRoleEntity(user_id=outsider.id, role_id=role.id))
        if os.environ.get('FOUNDATION_TASK') == '028':
            import importlib.util
            spec = importlib.util.spec_from_file_location('owned_inline_seed', Path(__file__).with_name('inline-attachments-paired-seed.py'))
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            reviewer = (await session.exec(select(UserEntity).where(UserEntity.username == accounts['users'][1]))).one()
            await module.seed_inline_attachments(session, actor, reviewer, accounts)
        operator = UserEntity(username=f'owned-operator-{uuid7()}', hashed_password=actor.hashed_password, is_superuser=True)
        session.add(operator)
        accounts['users'].append(operator.username)
    accounts_path.write_text(json.dumps(accounts))
    accounts_path.chmod(0o600)
    await engine.dispose()

if __name__ == '__main__':
    asyncio.run(main())
