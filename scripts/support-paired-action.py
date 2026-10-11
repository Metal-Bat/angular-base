"""Bounded task-013 fault injection, only in the owned disposable database."""
import asyncio
import json
import os
import sys


async def main():
    assert os.environ['POSTGRES_DB'] == 'test'
    assert os.environ['PROJECT_NAME'] == 'frontend-disposable-smoke'
    assert os.environ['POSTGRES_HOST'] == '127.0.0.1'
    assert os.environ['FOUNDATION_TASK'] == '013'
    from sqlalchemy import text
    from core.deps import engine
    action = sys.argv[1]
    assert action in {'sink_off', 'sink_on', 'business_fault', 'cleanup'}
    async with engine.begin() as connection:
        if action == 'sink_off':
            await connection.execute(text("""CREATE FUNCTION app_fe_owned_sink_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'owned support sink fault'; END; $$"""))
            await connection.execute(text('CREATE TRIGGER app_fe_owned_sink_fault BEFORE INSERT OR UPDATE ON "SUPPORT_INCIDENT" FOR EACH ROW EXECUTE FUNCTION app_fe_owned_sink_fault()'))
        if action == 'business_fault':
            await connection.execute(text("""CREATE FUNCTION app_fe_owned_business_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."CODE" = 'owned-support-rollback' THEN RAISE EXCEPTION 'owned business fault'; END IF; RETURN NEW; END; $$"""))
            await connection.execute(text('CREATE TRIGGER app_fe_owned_business_fault AFTER INSERT ON "FORM_DEFINITION" FOR EACH ROW EXECUTE FUNCTION app_fe_owned_business_fault()'))
        if action in {'sink_on', 'cleanup'}:
            await connection.execute(text('DROP TRIGGER IF EXISTS app_fe_owned_sink_fault ON "SUPPORT_INCIDENT"'))
            await connection.execute(text('DROP FUNCTION IF EXISTS app_fe_owned_sink_fault()'))
        if action == 'cleanup':
            await connection.execute(text('DROP TRIGGER IF EXISTS app_fe_owned_business_fault ON "FORM_DEFINITION"'))
            await connection.execute(text('DROP FUNCTION IF EXISTS app_fe_owned_business_fault()'))
    await engine.dispose()
    print(json.dumps({'owned_fault_action': action}))


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except Exception as error:
        print(json.dumps({'exception': type(error).__name__}))
        raise SystemExit(1)
