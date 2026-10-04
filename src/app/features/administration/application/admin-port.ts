import { AdminCommand, AdminInput, AdminResult } from '../domain/admin-command';
export type AdminPort = {
  groups(): readonly { key: string; title: string }[];
  commands(group: string): readonly AdminCommand[];
  send(command: AdminCommand, input: AdminInput): Promise<AdminResult>;
};
