"""Owned authoring acceptance; human approval precedes every possible AI call."""
import os
from datetime import timedelta
from decimal import Decimal
from uuid import uuid7


async def seed_agent_authoring(session, actor, connection, accounts):
    assert os.environ['POSTGRES_DB'] == 'test'
    assert os.environ['PROJECT_NAME'] == 'frontend-disposable-smoke'
    from sqlmodel import select
    from apps.ai.application.agent_service import AIAgentService
    from apps.ai.domain.agent import AIAgentDraftSpec, AIPrice
    from apps.ai.domain.contracts import AITaskLimits
    from apps.forms.application.service import FormService
    from apps.forms.domain.dto import FormCreateDTO, FormVersionCreateDTO
    from apps.integrations.application.providers import StatusProvider
    from apps.integrations.application.service import ConnectionService
    from apps.reporting.domain.entity import ReportEntity
    from apps.step_types.application.registry import get_registry
    from apps.step_types.application.service import StepTypeService
    from apps.step_types.domain.entity import StepTypeEntity, StepTypeVersionEntity
    from apps.users.application.reporting import USER_REPORT
    from apps.users.domain.auth_entity import PermissionEntity, RoleEntity, RolePermissionEntity, UserRoleEntity
    from apps.workflows.application.service import WorkflowService
    from apps.workflows.domain.dto import GraphSnapshot, WorkflowCreateDTO, WorkflowVersionCreateDTO
    from apps.requests.application.service import RequestService
    from apps.requests.domain.dto import BusinessRequestCreateDTO, RequestTypeCreateDTO
    from core.ref_id import create_ref_id
    from utils.date_utils import get_datetime_utc

    class NoSecrets:
        def resolve(self, reference, version):
            raise RuntimeError('Owned authoring acceptance must never resolve provider credentials')

    permissions = RoleEntity(name='owned-agent-acceptance-' + uuid7().hex)
    session.add(permissions)
    await session.flush()
    session.add(UserRoleEntity(user_id=actor.id, role_id=permissions.id))
    for name in ['admin.users.manage', 'requests.start']:
        permission = (await session.exec(select(PermissionEntity).where(PermissionEntity.name == name))).one()
        session.add(RolePermissionEntity(role_id=permissions.id, permission_id=permission.id))
    await session.flush()
    limits = AITaskLimits(requests=2, tool_calls=0, input_tokens=1000, output_tokens=500,
                          total_tokens=1500, elapsed_seconds=30, spend_usd=Decimal('0.50'), strict_spend=False)
    spec = AIAgentDraftSpec.model_validate({
        'connection_ref': create_ref_id(connection.id, connection.version), 'provider_key': 'typesafe',
        'model_id': 'owned-model', 'prompt_version': '1', 'instructions': 'Only classify after the required human authorization.',
        'decision': {'question': 'Which queue?', 'options_input_key': 'choices'},
        'data_policy': {'allowed_fields': ['question', 'choices'], 'allowed_classifications': ['PUBLIC', 'INTERNAL']},
        'field_classifications': {'question': 'PUBLIC', 'choices': 'PUBLIC'}, 'user_limits': limits.model_dump(mode='json'),
    })
    agents = AIAgentService(session, ConnectionService(session, StatusProvider(NoSecrets(), {})),
                           admin_limits=limits, prices={'typesafe:owned-model': AIPrice(version='owned-acceptance', fixed_per_request_usd=Decimal('0.01'), input_per_million_usd=Decimal('0'), output_per_million_usd=Decimal('0'))})
    draft = await agents.create('owned-eligible-agent', 'Owned eligible agent', spec, actor)
    published = await agents.publish(create_ref_id(draft.id, draft.version), actor)
    agent_ref = create_ref_id(published.id, published.version)
    lookup_spec = spec.model_copy(update={
        'data_policy': spec.data_policy.model_copy(update={'allowed_tools': {'lookup_saved_report'}, 'allowed_retrieval_sources': {'report.users'}}),
        'user_limits': limits.model_copy(update={'tool_calls': 1}),
    })
    await agents.create('owned-lookup-plan', 'Owned lookup plan', lookup_spec, actor)
    session.add(ReportEntity(owner_id=actor.id, definition_key=USER_REPORT.key, definition_version=USER_REPORT.version,
        max_rows=3, chunk_size=1, parallelism=1, priority=5, task_id=str(uuid7()), expires_at=get_datetime_utc()+timedelta(days=1)))
    forms = FormService(session)
    form = await forms.create(FormCreateDTO(code='owned-ai-review', name='Owned AI authorization'), actor.id)
    form_version = await forms.create_version(FormVersionCreateDTO(form_ref_id=create_ref_id(form.id, form.version), number=1,
        data_schema={'type':'object','properties':{'amount':{'type':'string'}},'required':['amount']},
        render_schema={'dialect':'bpms.render/1','root':{'component':'vertical','children':[{'component':'text','scope':'/properties/amount','label':'Amount'}]},'outcomes':['approve']}))
    form_version = await forms.publish(create_ref_id(form_version.id, form_version.version), actor.id)
    registry = get_registry()
    await StepTypeService(session, registry).reconcile()
    rows = (await session.exec(select(StepTypeEntity, StepTypeVersionEntity).join(StepTypeVersionEntity,
        StepTypeVersionEntity.step_type_id == StepTypeEntity.id).where(StepTypeVersionEntity.status == 'PUBLISHED'))).all()
    refs = {item.code: create_ref_id(pin.id, pin.version) for item,pin in rows}
    step = lambda key, code, **kw: {'key':key,'type_code':code,'type_version_ref':refs[code],**kw}
    human = {'form_ref': create_ref_id(form_version.id, form_version.version), 'field_policy': {'read':['/properties/amount'],'write':['/properties/amount'],'required':['/properties/amount'],'hidden':[]}}
    choices = [{'key':key,'labels':{'en':key.title()},'description':'Synthetic '+key} for key in ['support','finance']]
    shape = {'type':'object','properties':{'question':{'type':'string'},'choices':{'type':'array','items':{'type':'object'}}},'required':['question','choices']}
    graph = GraphSnapshot.model_validate({'steps':[step('start','START'),step('authorize','HUMAN_TASK',**human),step('classify','AI_DECISION',config={'agent_ref':agent_ref}),step('review','HUMAN_TASK',**human),step('finish','FINISH')],
        'transitions':[{'source':a,'target':b,'outcome':outcome,'is_default':True} for a,b,outcome in [('start','authorize','next'),('authorize','classify','approve'),('classify','finish','next'),('classify','review','review'),('review','finish','approve')]],
        'targets':[{'step':key,'user_ref':create_ref_id(actor.id,actor.version)} for key in ['authorize','review']],
        'bindings':[{'step':'classify','target_port':'data','target_schema':shape,'ordinal':index,'target_projection':{'dialect':'bpms.binding.object/1','path':'/'+name},'source_kind':'CONSTANT','constant_value':value} for index,(name,value) in enumerate([('question','Synthetic author question'),('choices',choices)])]})
    workflows = WorkflowService(session, registry)
    root = await workflows.create(WorkflowCreateDTO(code='owned-agent-review', name='Owned agent review'), actor.id)
    version = await workflows.create_version(WorkflowVersionCreateDTO(workflow_ref_id=create_ref_id(root.id,root.version),number=1))
    version = await workflows.replace_graph(create_ref_id(version.id,version.version), graph, actor.id)
    version = await workflows.publish(create_ref_id(version.id,version.version),actor.id)
    requests = RequestService(session)
    kind = await requests.create_type(RequestTypeCreateDTO(code='owned-agent-review',name='Owned agent review',workflow_ref_id=create_ref_id(root.id,root.version),form_ref_id=create_ref_id(form.id,form.version)))
    request,_ = await requests.create_draft(BusinessRequestCreateDTO(request_type_ref_id=create_ref_id(kind.id,kind.version),data={'amount':'1'}),actor)
    accounts['eligible_agent'] = agent_ref
    accounts['eligible_evaluation_request'] = create_ref_id(request.id,request.version)
