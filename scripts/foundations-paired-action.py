"""Tick actual scheduler/outbox owners only inside the owned disposable harness."""
import asyncio
import json
import os
import sys
from pathlib import Path
from uuid import uuid7


async def main():
    assert os.environ['POSTGRES_DB'] == 'test'
    assert os.environ['PROJECT_NAME'] == 'frontend-disposable-smoke'
    from sqlmodel import col, select
    from core.deps import SessionFactory, engine
    from core.celery_app import celery_app
    from core.celery_scheduler import _claim_leader, _enqueue_due, _release_leader
    from apps.tasks.application.outbox import dispatch_outbox
    from apps.calendar.domain.entity import CalendarEventEntity
    from apps.calendar.domain.reminder import CalendarReminderEntity
    from apps.users.domain.entity import UserEntity
    if sys.argv[1:] in (['reviewer_finish'], ['literal_finish']):
        assert os.environ.get('FOUNDATION_TASK') == '029'
        literal = sys.argv[1:] == ['literal_finish']
        owned_code = 'owned-literal-scopes' if literal else 'owned-reviewer-corrections'
        from apps.requests.domain.entity import BusinessRequestEntity, RequestTypeEntity, FormSubmissionEntity
        from apps.work_items.domain.entity import WorkItemEntity, WorkItemActionEntity
        async with SessionFactory() as session:
            request = (await session.exec(select(BusinessRequestEntity).join(RequestTypeEntity, BusinessRequestEntity.request_type_id == RequestTypeEntity.id).where(RequestTypeEntity.code == owned_code))).one()
            assert request.status == 'COMPLETED', 'owned_request_status'
            submissions = (await session.exec(select(FormSubmissionEntity).where(FormSubmissionEntity.business_request_id == request.id))).all()
            assert len(submissions) == 4, 'owned_submission_count'
            original = [row for row in submissions if row.step_execution_id is None]
            assert len(original) == 1, 'owned_original_count'
            if literal:
                assert original[0].data['items_total'] == 5 and original[0].data['items'] == 'Requester literal', 'owned_original_submission'
                assert original[0].data['properties'][0]['items'] == 'Requester row', 'owned_original_row'
                row_key = original[0].item_identity['/properties'][0]
                corrected = [row for row in submissions if row.data.get('items') == 'Corrected literal']
                assert len(corrected) == 2, 'owned_corrected_submissions'
                assert all(row.data['properties'][1]['items'] == 'Corrected row' and row.item_identity['/properties'][1] == row_key for row in corrected), 'owned_stable_row'
            else:
                assert original[0].data['amount'] == 7, 'owned_original_submission'
                assert sum(row.data.get('amount') == 8 for row in submissions) == 2, 'owned_corrected_submissions'
            sentinel = 'owned-literal-hidden' if literal else 'owned-hidden-sentinel'
            assert all(row.data.get('private_note') == sentinel for row in submissions), 'owned_hidden_retention'
            items = (await session.exec(select(WorkItemEntity).where(WorkItemEntity.business_request_id == request.id))).all()
            assert len(items) == 3 and sorted(row.status for row in items) == ['COMPLETED','COMPLETED','RETURNED'], 'owned_work_statuses'
            decisions = (await session.exec(select(WorkItemActionEntity).join(WorkItemEntity, WorkItemActionEntity.work_item_id == WorkItemEntity.id).where(WorkItemEntity.business_request_id == request.id, col(WorkItemActionEntity.action).in_(['COMPLETE','RETURN','REJECT'])))).all()
            assert len(decisions) == 3 and len({row.work_item_id for row in decisions}) == 3, 'owned_decision_count'
        await engine.dispose()
        print(json.dumps({'original_submission':'preserved','corrected_task_submissions':'verified','hidden_data':'preserved','stable_row':'verified' if literal else 'not_applicable','decisions':3,'one_decision_per_task':True}))
        return
    if sys.argv[1:] == ['reviewer_intake']:
        assert os.environ.get('FOUNDATION_TASK') == '029'
        from apps.workflows.application.service import WorkflowService
        from apps.step_types.application.registry import builtin_registry
        from apps.workflows.domain.entity import WorkflowDefinitionEntity
        from apps.forms.domain.entity import FormVersionEntity, FormDefinitionEntity
        from apps.forms.domain.dto import FormDocuments
        from apps.forms.application.designs import resolve_form_documents
        from apps.clients.domain.contracts import ClientContext
        accounts = json.loads(Path(os.environ['BROWSER_ACCOUNTS_FILE']).read_text())
        async with SessionFactory() as session:
            actor = (await session.exec(select(UserEntity).where(UserEntity.username == accounts['users'][0]))).one()
            workflow = (await session.exec(select(WorkflowDefinitionEntity).where(WorkflowDefinitionEntity.code == 'owned-reviewer-corrections'))).one()
            version = (await session.exec(select(FormVersionEntity).join(FormDefinitionEntity, FormVersionEntity.form_definition_id == FormDefinitionEntity.id).where(FormDefinitionEntity.code == 'owned-reviewer-corrections'))).one()
            start = await WorkflowService(session,builtin_registry()).can_access(workflow,actor,'start')
            resolved = False
            try:
                resolve_form_documents(FormDocuments.model_validate(version,from_attributes=True),ClientContext.legacy())
                resolved = True
            except ValueError:
                pass
        await engine.dispose()
        print(json.dumps({'workflow_start':start,'form_resolves':resolved}))
        return
    if sys.argv[1:] == ['workflow']:
        assert os.environ.get('FOUNDATION_TASK') == '021'
        from apps.processes.application.waits import fire_due_actions
        owner = uuid7()
        fired = 0
        # Exercise the actual due-action owner against the current clock only.
        # No clock override or process/execution/result writes are permitted here.
        for _ in range(40):
            fired += await fire_due_actions(owner)
            await dispatch_outbox(celery_app)
            await asyncio.sleep(.1)
        await engine.dispose()
        print(json.dumps({'scheduler': 'real_due_actions', 'fired': fired}))
        return
    if sys.argv[1:] == ['subprocess']:
        assert os.environ.get('FOUNDATION_TASK') == '021'
        # Deliver the real committed outbox through the already-owned Celery worker.
        # No process, execution, receipt or result state is written by this driver.
        for _ in range(30):
            await dispatch_outbox(celery_app)
            await asyncio.sleep(.1)
        from apps.processes.domain.entity import ProcessInstanceEntity, StepExecutionEntity
        from apps.workflows.domain.entity import WorkflowDefinitionEntity, WorkflowVersionEntity
        # Inspect only this journey's synthetic, owned child. No snapshot data is
        # returned or logged and no business state is written by these assertions.
        for _ in range(100):
            async with SessionFactory() as session:
                child = (await session.exec(select(ProcessInstanceEntity)
                    .join(WorkflowVersionEntity, ProcessInstanceEntity.workflow_version_id == WorkflowVersionEntity.id)
                    .join(WorkflowDefinitionEntity, WorkflowVersionEntity.workflow_definition_id == WorkflowDefinitionEntity.id)
                    .where(WorkflowDefinitionEntity.code == 'owned-subprocess-child', col(ProcessInstanceEntity.parent_step_execution_id).is_not(None)))).one()
                parent_execution = await session.get(StepExecutionEntity, child.parent_step_execution_id)
                if parent_execution is not None and parent_execution.status == 'COMPLETED':
                    assert child.status == 'COMPLETED'
                    assert child.input_context == {'payload': {'model_id': 'ui-label', 'enabled': False}, 'rows': [''], 'note': '42', 'raw': 'prior-output-value', 'state': 'WAITING'}
                    assert parent_execution.output_snapshot == {'result': '42'}
                    break
            await dispatch_outbox(celery_app)
            await asyncio.sleep(.1)
        else:
            raise RuntimeError('Owned child did not settle')
        await engine.dispose()
        print(json.dumps({'outbox': 'real_dispatch', 'worker': 'owned_celery', 'input_output_contract': 'verified_owned_synthetic'}))
        return
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
        if isinstance(error, AssertionError) and error.args and str(error.args[0]).startswith('owned_'):
            print('AssertionError: ' + str(error.args[0]), file=sys.stderr)
        print(json.dumps({'exception': type(error).__name__}))
        raise SystemExit(1)
