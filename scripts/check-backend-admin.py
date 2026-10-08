"""Actual HTTP administration checks. Use only a disposable migrated database."""

import asyncio
import os
import sys
from pathlib import Path
from uuid import uuid7

backend = Path(os.environ["BACKEND_ROOT"]).resolve()
sys.path[:0] = [str(backend / "src"), str(backend)]
import tests.conftest  # noqa: E402,F401
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlmodel import select  # noqa: E402
from apps.users.domain.auth_entity import (  # noqa: E402
    PermissionEntity,
    RoleEntity,
    RolePermissionEntity,
    UserRoleEntity,
)
from apps.users.domain.entity import UserEntity  # noqa: E402
from core.deps import SessionFactory, engine  # noqa: E402
from main import app  # noqa: E402
from utils.security import hash_password  # noqa: E402


async def main():
    password = "Disposable-" + str(uuid7())
    digest = await hash_password(password)
    scopes = [
        "admin.users.manage",
        "admin.permissions.manage",
        "admin.work_groups.manage",
        "admin.tasks.manage",
        "integrations.manage",
        "workflows.manage",
        "admin.history.read",
    ]
    async with SessionFactory() as session:
        author = UserEntity(
            username="admin-check-" + str(uuid7()), hashed_password=digest
        )
        outsider = UserEntity(
            username="outsider-" + str(uuid7()), hashed_password=digest
        )
        role = RoleEntity(name="operator-" + str(uuid7()))
        session.add_all([author, outsider, role])
        await session.flush()
        session.add(UserRoleEntity(user_id=author.id, role_id=role.id))
        for scope in scopes + ["requests.start"]:
            permission = (
                await session.exec(
                    select(PermissionEntity).where(PermissionEntity.name == scope)
                )
            ).one_or_none()
            if permission is None:
                permission = PermissionEntity(name=scope)
                session.add(permission)
                await session.flush()
            if scope in scopes:
                session.add(
                    RolePermissionEntity(role_id=role.id, permission_id=permission.id)
                )
        await session.commit()
        names = author.username, outsider.username
    count = 0
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:

            async def login(username, secret=password):
                response = await client.post(
                    "/api/v1/auth/login",
                    json={"username": username, "password": secret},
                )
                assert response.status_code == 200
                return {
                    "Authorization": "Bearer " + response.json()["data"]["access_token"]
                }

            headers = await login(names[0])
            denied = await login(names[1])

            async def request(method, path, body=None, status=200, actor=headers):
                nonlocal count
                response = await client.request(
                    method, "/api/v1/" + path, json=body, headers=actor
                )
                assert response.status_code == status, (
                    method,
                    path,
                    response.status_code,
                )
                count += 1
                return response.json()

            for path in [
                "admin/users/search",
                "admin/roles/search",
                "admin/permissions/search",
                "admin/work-groups/search",
                "admin/audit-events/search",
                "tasks/schedules/search",
                "integration-connections/search",
                "ai-agents/search",
            ]:
                await request(
                    "POST", path, {"page": 1, "size": 20}, actor=denied, status=403
                )
                result = await request("POST", path, {"page": 1, "size": 20})
                assert "result" in result
            username = "managed-" + str(uuid7())
            user = (
                await request(
                    "POST",
                    "admin/users",
                    {"username": username, "password": password},
                    status=201,
                )
            )["data"]
            assert "password" not in user and "hashed_password" not in user
            original = user["ref_id"]
            user = (
                await request(
                    "PUT", "admin/users/" + original, {"first_name": "Renamed"}
                )
            )["data"]
            await request(
                "PUT", "admin/users/" + original, {"first_name": "Stale"}, status=409
            )
            user_path = "admin/users/" + user["ref_id"]
            await request("POST", user_path + "/history", {"page": 1, "size": 20})
            role_name = "assigned-" + str(uuid7())
            await request(
                "POST",
                "admin/roles",
                {"name": role_name, "permissions": ["requests.start"]},
                status=201,
            )
            await request("POST", user_path + "/roles", {"role_name": role_name})
            member_headers = await login(username)
            permissions = await request(
                "POST",
                "auth/permissions/search",
                {"page": 1, "size": 100},
                actor=member_headers,
            )
            assert "requests.start" in permissions["result"]["items"]
            new_password = "Reset-" + str(uuid7())
            user = (await request("GET", user_path))["data"]
            user_path = "admin/users/" + user["ref_id"]
            await request(
                "POST", user_path + "/reset-password", {"new_password": new_password}
            )
            await request("GET", "auth/me", actor=member_headers, status=401)
            await login(username, new_password)
            user = (await request("GET", user_path))["data"]
            group = (
                await request(
                    "POST",
                    "admin/work-groups",
                    {"code": "G" + uuid7().hex, "name": "Disposable group"},
                    status=201,
                )
            )["data"]
            group_path = "admin/work-groups/" + group["ref_id"]
            await request(
                "POST", group_path + "/members", {"user_ref_id": user["ref_id"]}
            )
            await request(
                "POST",
                group_path + "/members/deactivate",
                {"user_ref_id": user["ref_id"]},
            )
            await request("DELETE", group_path + "/members/" + user["ref_id"])
            user_path = "admin/users/" + user["ref_id"]
            await request("DELETE", user_path)
            deleted = (await request("GET", user_path))["data"]
            assert deleted["deleted_at"] is not None and not deleted["is_active"]
            user_path = "admin/users/" + deleted["ref_id"]
            await request("POST", user_path + "/restore")
            restored = (await request("GET", user_path))["data"]
            assert restored["deleted_at"] is None and restored["is_active"]
        print(
            f"Passed {count} actual HTTP administration checks with non-superuser operator and outsider."
        )
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
