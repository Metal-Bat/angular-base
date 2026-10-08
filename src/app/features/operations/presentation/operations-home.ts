import { OperationsGuide } from './operations-guide';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';

@Component({
  imports: [OperationsGuide, RouterLink, LocalizePipe, ButtonModule],
  selector: 'app-operations-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './operations-home.scss',
  templateUrl: './operations-home.html',
})
export class OperationsHome {
  readonly workspaces = [
    {
      label: 'My requests',
      description: 'Create drafts and track submitted requests.',
      icon: 'pi pi-file',
      path: '/operations/requests',
      tone: 'blue',
    },
    {
      label: 'Task inbox',
      description: 'Claim, review, and complete assigned work.',
      icon: 'pi pi-inbox',
      path: '/operations/tasks',
      tone: 'violet',
    },
    {
      label: 'My reports',
      description: 'Review the reports available to your account.',
      icon: 'pi pi-chart-bar',
      path: '/operations/reports',
      tone: 'teal',
    },
  ];
  readonly resources = [
    {
      label: 'Notifications',
      description: 'Stay up to date with your work.',
      icon: 'pi pi-bell',
      path: '/operations/notifications',
    },
    {
      label: 'Private uploads',
      description: 'Manage files for your requests and tasks.',
      icon: 'pi pi-folder',
      path: '/operations/media',
    },
    {
      label: 'Account and sessions',
      description: 'Review your profile and active sessions.',
      icon: 'pi pi-user',
      path: '/account',
    },
  ];
  readonly steps = [
    {
      title: 'Start a request',
      description: 'Choose a request type and complete its form.',
      path: '/operations/catalog',
    },
    {
      title: 'Review assigned work',
      description: 'Open your task inbox to see what needs your attention.',
      path: '/operations/tasks',
    },
    {
      title: 'Follow progress',
      description: 'Open a request to follow its timeline and outcome.',
      path: '/operations/requests',
    },
  ];
}
