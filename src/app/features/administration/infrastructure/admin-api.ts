import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/transport/api-client';
import { RequestInput } from '../../../core/transport/api-types';
import {
  readData,
  readDataPage,
  readResultPage,
  responseMetadata,
} from '../../../core/transport/response-adapters';
import { record } from '../../../core/transport/api-failure';
import {
  Contract,
  fieldSpecs,
  operation,
} from '../../studio/infrastructure/resource-specifications';
import { JsonValue } from '../../forms/domain/runtime-document';
import { AdminPort } from '../application/admin-port';
import {
  AdminCommand,
  AdminInput,
  AdminResult,
  freezeCommand,
  redactAdmin,
} from '../domain/admin-command';
import contracts from './admin-contracts.json';
const catalog: Record<string, { title: string; commands: AdminCommand[] }> =
  Object.fromEntries(
    Object.entries(contracts).map(([key, group]) => [
      key,
      {
        title: group.title,
        commands: group.commands.map((command) => {
          const shape = {
            title: command.title,
            permission: command.permission,
            editor: null,
            operations: {},
            schemas: command.schemas as unknown as Contract['schemas'],
          };
          return {
            ...command,
            fields: {
              body: fieldSpecs(shape, 'body'),
              path: fieldSpecs(shape, 'path'),
              query: fieldSpecs(shape, 'query'),
            },
          };
        }),
      },
    ]),
  );
@Injectable({ providedIn: 'root' })
export class AdminApi implements AdminPort {
  private readonly api = inject(ApiClient);
  groups(): readonly { key: string; title: string }[] {
    return Object.entries(catalog).map(([key, group]) => ({
      key,
      title: group.title,
    }));
  }
  commands(group: string): readonly AdminCommand[] {
    return catalog[group]?.commands ?? [];
  }
  async send(command: AdminCommand, input: AdminInput): Promise<AdminResult> {
    const trusted = Object.values(catalog)
      .flatMap((group) => group.commands)
      .find((item) => item.id === command.id);
    if (!trusted) {
      throw Error('Unknown administration operation');
    }
    const snapshot = freezeCommand(trusted, input);
    const id = operation(trusted.id);
    const response = await firstValueFrom(
      this.api.call(id, {
        ...(trusted.bodyRequired || Object.keys(snapshot.body).length
          ? { body: snapshot.body }
          : {}),
        ...(Object.keys(snapshot.path).length ? { path: snapshot.path } : {}),
        ...(Object.keys(snapshot.query).length
          ? { query: snapshot.query }
          : {}),
      } as RequestInput<typeof id>),
    );
    const requestId = responseMetadata(response).requestId;
    if (Array.isArray(response.body)) {
      return {
        value: redactAdmin(response.body as JsonValue),
        page: 1,
        totalPages: 1,
        requestId,
      };
    }
    const envelope = record(response.body);
    const data = envelope['data'];
    const paged =
      'result' in envelope ||
      (data && typeof data === 'object' && 'items' in data);
    if (paged) {
      const page =
        'result' in envelope
          ? readResultPage(response, (value) => value as JsonValue)
          : readDataPage(response, (value) => value as JsonValue);
      return {
        value: redactAdmin(page.items as JsonValue[]),
        page: page.page,
        totalPages: page.totalPages,
        requestId,
      };
    }
    return {
      value: readData(response, (value) =>
        redactAdmin((value ?? null) as JsonValue),
      ),
      page: 1,
      totalPages: 1,
      requestId,
    };
  }
}
