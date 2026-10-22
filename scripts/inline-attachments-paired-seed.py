"""Create only new inline-transfer records inside the guarded disposable fixture."""
import os
from uuid import uuid7


async def seed_inline_attachments(session, actor, reviewer, accounts):
    assert os.environ['POSTGRES_DB'] == 'test'
    assert os.environ['PROJECT_NAME'] == 'frontend-disposable-smoke'
    from apps.forms.application.service import FormService
    from apps.forms.domain.dto import FormCreateDTO, FormVersionCreateDTO
    from apps.requests.application.service import RequestService
    from apps.requests.domain.dto import RequestTypeCreateDTO
    from apps.step_types.application.registry import builtin_registry
    from apps.workflows.application.service import WorkflowService
    from apps.workflows.domain.dto import (
        GraphSnapshot, GraphStep, GraphTarget, GraphTransition,
        WorkflowCreateDTO, WorkflowVersionCreateDTO,
    )
    from core.ref_id import create_ref_id
    from tests.integration.test_processes import _step_refs

    scope = '/properties/evidence'
    forms = FormService(session)
    form = await forms.create(FormCreateDTO(code=f'owned-inline-{uuid7().hex}', name='Owned inline evidence'), actor.id)
    version = await forms.create_version(FormVersionCreateDTO(
        form_ref_id=create_ref_id(form.id, form.version), number=1,
        data_schema={'type': 'object', 'properties': {'evidence': {'type': 'array', 'items': {'type': 'string'}, 'default': []}}},
        render_schema={'dialect': 'bpms.render/1', 'outcomes': ['approve'], 'root': {'component': 'attachment_collection', 'node_key': 'evidence', 'scope': scope, 'label': 'Private evidence', 'options': {
            'allowed_kinds': ['file', 'image'], 'allowed_mime_types': ['text/plain', 'image/webp'],
            'max_items': 6, 'max_item_bytes': 1048576, 'max_total_bytes': 4194304,
            'caption_required': True, 'preview': True, 'allow_remove': True,
            'allow_replace': True, 'allow_reorder': True,
        }}},
    ))
    version = await forms.publish(create_ref_id(version.id, version.version), actor.id)
    registry = await _step_refs(session)
    workflows = WorkflowService(session, builtin_registry())
    workflow = await workflows.create(WorkflowCreateDTO(code=f'owned-inline-{uuid7().hex}', name='Owned inline review'), actor.id)
    draft = await workflows.create_version(WorkflowVersionCreateDTO(workflow_ref_id=create_ref_id(workflow.id, workflow.version), number=1))
    draft = await workflows.replace_graph(create_ref_id(draft.id, draft.version), GraphSnapshot(
        steps=[
            GraphStep(key='start', type_code='START', type_version_ref=registry[('START', 1)]),
            GraphStep(key='review', type_code='HUMAN_TASK', type_version_ref=registry[('HUMAN_TASK', 1)],
                form_ref=create_ref_id(version.id, version.version),
                task_contract={'inherit_previous': True, 'default_view': 'review', 'views': [{'key': 'review', 'purpose': 'edit', 'title': {'en': 'Evidence review'}, 'scopes': [scope]}],
                    'actions': [{'key': 'approve', 'kind': 'complete', 'outcome_key': 'approve', 'title': {'en': 'Approve'}, 'required_scopes': []}]},
                field_policy={'read': [scope], 'write': [scope], 'required': [], 'hidden': []}),
            GraphStep(key='finish', type_code='FINISH', type_version_ref=registry[('FINISH', 1)]),
        ],
        targets=[GraphTarget(step='review', user_ref=create_ref_id(reviewer.id, reviewer.version))],
        transitions=[GraphTransition(source='start', target='review', outcome='next', is_default=True), GraphTransition(source='review', target='finish', outcome='approve', is_default=True)],
    ))
    await workflows.publish(create_ref_id(draft.id, draft.version), actor.id)
    kind = await RequestService(session).create_type(RequestTypeCreateDTO(code=f'owned-inline-{uuid7().hex}', name='Owned inline evidence', workflow_ref_id=create_ref_id(workflow.id, workflow.version), form_ref_id=create_ref_id(form.id, form.version)))
    accounts['inline_request_type'] = create_ref_id(kind.id, kind.version)
