import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
// Map PrimeNG's public semantic tokens to Material's system tokens. Utility
// classes remain last in the cascade; no internal widget selectors are overridden.
export const workspacePreset = definePreset(Aura, {
  semantic: {
    focusRing: {
      width: '3px',
      style: 'solid',
      color: 'var(--mat-sys-primary)',
      offset: '3px',
    },
    borderRadius: '0.5rem',
    colorScheme: {
      light: {
        primary: {
          color: 'var(--mat-sys-primary)',
          contrastColor: 'var(--mat-sys-on-primary)',
          hoverColor: 'var(--mat-sys-primary)',
          activeColor: 'var(--mat-sys-primary)',
        },
        formField: {
          background: 'var(--mat-sys-surface)',
          color: 'var(--mat-sys-on-surface)',
          borderColor: 'var(--mat-sys-outline)',
          invalidBorderColor: 'var(--mat-sys-error)',
        },
      },
      dark: {
        primary: {
          color: 'var(--mat-sys-primary)',
          contrastColor: 'var(--mat-sys-on-primary)',
          hoverColor: 'var(--mat-sys-primary)',
          activeColor: 'var(--mat-sys-primary)',
        },
        formField: {
          background: 'var(--mat-sys-surface)',
          color: 'var(--mat-sys-on-surface)',
          borderColor: 'var(--mat-sys-outline)',
          invalidBorderColor: 'var(--mat-sys-error)',
        },
      },
    },
  },
});
