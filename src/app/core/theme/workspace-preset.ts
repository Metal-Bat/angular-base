import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
// Share the console palette between PrimeNG controls and Tailwind layouts. Utility
// classes remain last in the cascade; no internal widget selectors are overridden.
export const workspacePreset = definePreset(Aura, {
  components: {
    button: {
      colorScheme: {
        light: {
          outlined: { secondary: { color: 'var(--console-muted)' } },
          text: {
            secondary: {
              color: 'var(--console-accent)',
              hoverBackground: 'var(--console-accent-soft)',
              activeBackground: 'var(--console-accent-soft)',
            },
          },
        },
        dark: {
          outlined: { secondary: { color: 'var(--console-muted)' } },
          text: {
            secondary: {
              color: 'var(--console-accent)',
              hoverBackground: 'var(--console-accent-soft)',
              activeBackground: 'var(--console-accent-soft)',
            },
          },
        },
      },
    },
  },
  semantic: {
    primary: Object.fromEntries(
      [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => [
        shade,
        `var(--console-primary-${shade})`,
      ]),
    ),
    focusRing: {
      width: '3px',
      style: 'solid',
      color: 'var(--console-accent)',
      offset: '3px',
    },
    borderRadius: '0.5rem',
    colorScheme: {
      light: {
        primary: {
          color: 'var(--console-accent)',
          contrastColor: 'var(--console-on-accent)',
          hoverColor: 'var(--console-accent-hover)',
          activeColor: 'var(--console-accent-hover)',
        },
        content: {
          background: 'var(--console-surface)',
          color: 'var(--console-text)',
          borderColor: 'var(--console-border)',
          hoverBackground: 'var(--console-accent-soft)',
          hoverColor: 'var(--console-text)',
        },
        overlay: {
          modal: {
            background: 'var(--console-surface)',
            color: 'var(--console-text)',
            borderColor: 'var(--console-border)',
          },
        },
        formField: {
          background: 'var(--console-surface)',
          color: 'var(--console-text)',
          borderColor: 'var(--console-input-border)',
          invalidBorderColor: 'var(--mat-sys-error)',
        },
      },
      dark: {
        primary: {
          color: 'var(--console-accent)',
          contrastColor: 'var(--console-on-accent)',
          hoverColor: 'var(--console-accent-hover)',
          activeColor: 'var(--console-accent-hover)',
        },
        content: {
          background: 'var(--console-surface)',
          color: 'var(--console-text)',
          borderColor: 'var(--console-border)',
          hoverBackground: 'var(--console-accent-soft)',
          hoverColor: 'var(--console-text)',
        },
        overlay: {
          modal: {
            background: 'var(--console-surface)',
            color: 'var(--console-text)',
            borderColor: 'var(--console-border)',
          },
        },
        formField: {
          background: 'var(--console-surface)',
          color: 'var(--console-text)',
          borderColor: 'var(--console-input-border)',
          invalidBorderColor: 'var(--mat-sys-error)',
        },
      },
    },
  },
});
