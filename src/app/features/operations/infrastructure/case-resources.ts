import { jsonObject } from '../../forms/infrastructure/runtime-shape';
import { correctionValue } from '../../forms/domain/correction-values';
import { firstValueFrom } from 'rxjs';
import { record } from '../../../core/transport/api-failure';
import {
  readData,
  readResultPage,
} from '../../../core/transport/response-adapters';
import {
  Approval,
  CaseFeedback,
  FormResources,
} from '../../forms/application/form-resources';
import { CaseFiles } from './case-files';
import { stringField } from './workspace-decoders';
export class CaseResources extends CaseFiles implements FormResources {
  async view(): Promise<readonly CaseFeedback[]> {
    if (!this.task) {
      return [];
    }
    const response = await firstValueFrom(
      this.api.call('get_work_item_view_api_v1_work_items__ref_id__view_get', {
        path: { ref_id: this.reference },
        query: { key: this.editor.document()?.identity.view ?? '' },
      }),
    );
    return readData(response, (value) => {
      const view = record(value);
      const feedback = view['feedback'];
      const document = this.editor.document()!;
      if (!Array.isArray(feedback) || feedback.length > 256) {
        throw Error('Invalid feedback');
      }
      return feedback.map((raw) => {
        const item = record(raw);
        const scope = stringField(item, 'scope');
        const key =
          typeof item['item_key'] === 'string' ? item['item_key'] : null;
        const current = correctionValue(
          document.canonical,
          scope,
          key,
          document.rowIdentity,
        );
        const prior = correctionValue(
          document.before,
          scope,
          key,
          document.beforeRowIdentity ?? null,
        );
        return {
          current,
          prior,
          key: stringField(item, 'key'),
          scope,
          item: key,
          message: stringField(item, 'message'),
          status: stringField(item, 'status'),
        };
      });
    });
  }
  async resolveFeedback(key: string): Promise<void> {
    if (!this.editor.canEdit() || !(await this.flush())) {
      return;
    }
    await this.editor.command({ key }, async (reference, body) =>
      readData(
        await firstValueFrom(
          this.api.call(
            'resolve_work_item_feedback_api_v1_work_items__ref_id__feedback__feedback_key__resolve_post',
            { path: { ref_id: reference, feedback_key: body.key } },
          ),
        ),
        (value) => this.referenceFrom(value),
      ),
    );
  }
  async personal(
    action: 'read' | 'pin' | 'archive' | 'watch',
    selected: boolean,
  ): Promise<void> {
    const operations = {
      read: 'read_work_item_api_v1_work_items__ref_id__read_post',
      pin: 'pin_work_item_api_v1_work_items__ref_id__pin_post',
      archive: 'archive_work_item_api_v1_work_items__ref_id__archive_post',
      watch: 'watch_work_item_api_v1_work_items__ref_id__watch_post',
    } as const;
    if (!(await this.flush())) {
      return;
    }
    await this.editor.command({ value: selected }, async (reference, body) =>
      readData(
        await firstValueFrom(
          this.api.call(operations[action], {
            path: { ref_id: reference },
            body,
          }),
        ),
        (value) => this.referenceFrom(value),
      ),
    );
  }
  async comment(comment: string): Promise<void> {
    if (!comment.trim() || !(await this.flush())) {
      return;
    }
    await this.editor.command(
      { comment },
      async (reference, body, key) =>
        readData(
          await firstValueFrom(
            this.api.call(
              'comment_on_work_item_api_v1_work_items__ref_id__comment_post',
              {
                path: { ref_id: reference },
                body: { ...body, command_key: key! },
              },
            ),
          ),
          (value) => this.referenceFrom(value),
        ),
      true,
    );
  }
  async forward(
    users: readonly string[],
    groups: readonly string[],
    reason: string,
  ): Promise<void> {
    if (
      !this.editor.ownTask() ||
      this.editor.item()?.kind !== 'HUMAN_TASK' ||
      !reason.trim() ||
      !(await this.flush())
    ) {
      return;
    }
    if (!(await this.editor.feedback.confirm('Forward this task?'))) {
      return;
    }
    await this.editor.command(
      { user_ref_ids: [...users], work_group_ref_ids: [...groups], reason },
      async (reference, body, key) =>
        readData(
          await firstValueFrom(
            this.api.call(
              'forward_work_item_api_v1_work_items__ref_id__forward_post',
              {
                path: { ref_id: reference },
                body: { ...body, command_key: key! },
              },
            ),
          ),
          (value) => this.referenceFrom(value),
        ),
      true,
    );
  }
  async approval(): Promise<Approval> {
    if (!this.editor.ownTask() || this.editor.item()?.kind !== 'AI_APPROVAL') {
      throw Error('Claim the approval first');
    }
    const response = await firstValueFrom(
      this.api.call(
        'tool_approval_detail_api_v1_ai_agents_work_items__work_item_ref__tool_approval_get',
        { path: { work_item_ref: this.reference } },
      ),
    );
    return readData(response, (value) => {
      const item = record(value);
      const status = stringField(item, 'status');
      if (
        ![
          'PENDING',
          'APPROVED',
          'DENIED',
          'EXPIRED',
          'CANCELLED',
          'CONSUMED',
        ].includes(status) ||
        !Number.isFinite(Date.parse(stringField(item, 'expires_at')))
      ) {
        throw Error('Invalid approval');
      }
      return {
        reference: stringField(item, 'work_item_ref'),
        status,
        tool: stringField(item, 'tool_key'),
        version: stringField(item, 'tool_version'),
        arguments:
          item['arguments'] === null ? null : jsonObject(item['arguments']),
        expires: stringField(item, 'expires_at'),
      };
    });
  }
  async decideApproval(approved: boolean): Promise<void> {
    if (
      !this.editor.ownTask() ||
      this.editor.item()?.kind !== 'AI_APPROVAL' ||
      !(await this.editor.feedback.confirm(
        approved ? 'Approve this exact tool call?' : 'Deny this tool call?',
      ))
    ) {
      return;
    }
    await this.editor.command(
      { approved },
      async (reference, body, key) =>
        readData(
          await firstValueFrom(
            this.api.call(
              'decide_tool_approval_api_v1_ai_agents_work_items__work_item_ref__tool_approval_post',
              {
                path: { work_item_ref: reference },
                body: { ...body, command_key: key! },
              },
            ),
          ),
          (value) => this.referenceFrom(value),
        ),
      true,
    );
  }
  async cancelRequest(): Promise<void> {
    if (
      this.task ||
      this.editor.item()?.status !== 'DRAFT' ||
      !(await this.flush()) ||
      !(await this.editor.feedback.confirm('Cancel this draft?'))
    ) {
      return;
    }
    await this.editor.command({}, async (reference) =>
      readData(
        await firstValueFrom(
          this.api.call(
            'cancel_request_api_v1_business_requests__ref_id__cancel_post',
            { path: { ref_id: reference } },
          ),
        ),
        (value) => this.referenceFrom(value),
      ),
    );
  }
  async requestReport(): Promise<
    readonly { reference: string; status: string }[]
  > {
    try {
      return readResultPage(
        await firstValueFrom(
          this.api.call(
            'report_requests_api_v1_business_requests_report_post',
            { body: { page: 1, size: 20, filters: [], sort_orders: [] } },
          ),
        ),
        (raw) => {
          const item = record(raw);
          return {
            reference: stringField(item, 'ref_id'),
            status: stringField(item, 'status'),
          };
        },
      ).items;
    } catch {
      this.editor.error.set('The service is unavailable.');
      return [];
    }
  }
  async administrative(action: 'cancel' | 'expire'): Promise<void> {
    if (
      !this.task ||
      !(await this.flush()) ||
      !(await this.editor.feedback.confirm(
        action === 'cancel'
          ? 'Cancel this task and its process?'
          : 'Expire this overdue task?',
      ))
    ) {
      return;
    }
    await this.editor.command(
      { action },
      async (reference, body, key) =>
        readData(
          await firstValueFrom(
            this.api.call(
              body.action === 'cancel'
                ? 'cancel_work_item_api_v1_work_items__ref_id__cancel_post'
                : 'expire_work_item_api_v1_work_items__ref_id__expire_post',
              { path: { ref_id: reference }, body: { command_key: key! } },
            ),
          ),
          (value) => this.referenceFrom(value),
        ),
      true,
    );
  }
  async poll(abort: AbortSignal): Promise<void> {
    if (
      this.editor.busy() ||
      this.editor.dirty() ||
      this.editor.blocked() ||
      this.transferBusy()
    ) {
      return;
    }
    const response = await firstValueFrom(
      this.api.call(
        this.task
          ? 'get_work_item_api_v1_work_items__ref_id__get'
          : 'get_request_api_v1_business_requests__ref_id__get',
        { path: { ref_id: this.reference } },
        abort,
      ),
    );
    const reference = readData(response, (value) => this.referenceFrom(value));
    if (
      !abort.aborted &&
      reference !== this.reference &&
      !this.editor.busy() &&
      !this.editor.dirty() &&
      !this.editor.blocked()
    ) {
      await this.editor.refresh(false);
    }
  }
  async resume(): Promise<void> {
    if (
      this.task ||
      !(await this.flush()) ||
      !(await this.editor.feedback.confirm(
        'Resume this presentation with the current client?',
      ))
    ) {
      return;
    }
    await this.editor.command(
      {},
      async (reference) =>
        readData(
          await firstValueFrom(
            this.api.call(
              'resume_request_presentation_api_v1_business_requests__ref_id__resume_presentation_post',
              { path: { ref_id: reference } },
            ),
          ),
          (value) => this.referenceFrom(value),
        ),
      false,
      true,
    );
  }
}
