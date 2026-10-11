import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SessionContext } from '../../../../core/auth/session-context';
import { DependencyReport } from '../../domain/dependencies';
import { DependencyReadiness } from './dependency-readiness';

describe('Authorized readiness repair and context invalidation', () => {
  it('routes real producer codes only through current authorized screens', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const session = TestBed.inject(SessionContext);
    session.resolve({
      status: 'authenticated',
      permissions: [
        'forms.manage',
        'workflows.manage',
        'admin.users.manage',
        'admin.work_groups.manage',
      ],
    });
    const fixture = TestBed.createComponent(DependencyReadiness);
    fixture.componentRef.setInput('reference', 'current');
    fixture.componentRef.setInput('inspect', vi.fn());
    const vm = fixture.componentInstance;
    expect(vm.repair('form_versions', 'human.form.not_published')).toBe(
      '/studio/forms',
    );
    expect(vm.repair('work_groups', 'human.user.unknown')).toBe('/users');
    expect(vm.repair('workflow_versions', 'human.work_group.inactive')).toBe(
      '/administration/groups',
    );
    expect(vm.repair('step_types')).toBe('/administration/step-types');
    session.updatePermissions(['workflows.manage']);
    expect(vm.repair('work_groups', 'human.user.unknown')).toBeNull();
    expect(vm.repair('form_versions', 'human.form.not_published')).toBeNull();
    session.clear();
    expect(vm.repair('step_types')).toBeNull();
  });
  it('invalidates a pending old-context result and permits a current check', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    let resolve!: (report: DependencyReport) => void;
    const report: DependencyReport = {
      ready: true,
      checked_at: '2026-10-09T00:00:00Z',
      client_readiness: 'ready',
      issues: [],
      pins: [],
    };
    const inspect = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<DependencyReport>((finish) => {
            resolve = finish;
          }),
      )
      .mockResolvedValue(report);
    const fixture = TestBed.createComponent(DependencyReadiness);
    fixture.componentRef.setInput('reference', 'current');
    fixture.componentRef.setInput('inspect', inspect);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    const oldCheck = vm.load();
    expect(vm.busy()).toBe(true);
    fixture.componentRef.setInput('clientRelease', 'current-release');
    fixture.detectChanges();
    expect(vm.busy()).toBe(false);
    resolve(report);
    await oldCheck;
    expect(vm.result()).toBeNull();
    await vm.load();
    expect(inspect).toHaveBeenLastCalledWith('current', 'current-release');
    expect(vm.result()).toEqual(report);
    fixture.destroy();
  });
});
