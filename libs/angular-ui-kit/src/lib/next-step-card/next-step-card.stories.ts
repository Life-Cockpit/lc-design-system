import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { NextStepCardComponent } from './next-step-card.component';
import { ButtonComponent } from '../button/button.component';
import { ButtonLinkComponent } from '../button/button-link.component';
import { IconComponent } from '../icon/icon.component';

const meta: Meta<NextStepCardComponent> = {
  title: 'Feedback/Next Step Card',
  component: NextStepCardComponent,
  decorators: [
    moduleMetadata({
      imports: [ButtonComponent, ButtonLinkComponent, IconComponent],
    }),
  ],
  argTypes: {
    tone: { control: 'select', options: ['neutral', 'primary', 'success', 'warning', 'info'] },
    variant: {
      control: 'select',
      options: ['default', 'soft'],
      description:
        '3.3: `default` (surface, border, 4 px rail, 36 px tinted bubble) or `soft` (tinted fill per tone, radius 24 px / 28 px from 1024 px, no rail, border or shadow, a 48 px white bubble with a 1 px ring; 56 px from 1024 px, 60 px from 1440 px; title 20 / 24 / 28 px bold).',
      table: { defaultValue: { summary: 'default' } },
    },
    titleTag: {
      control: 'select',
      options: ['div', 'h2', 'h3'],
      description:
        '3.3: element of the title: `div`, `h2` or `h3`. Use a heading when the page has sections, so heading navigation reaches the most important item. Semantics only, the look stays the same.',
      table: { defaultValue: { summary: 'div' } },
    },
    actionsLayout: {
      control: 'select',
      options: ['inline', 'stacked'],
      description:
        '3.3: `inline` — side by side at the end of the card, below 480 px card width in their own row and stretched. `stacked` — always in their own row, one per line at equal width, 8 px apart.',
      table: { defaultValue: { summary: 'inline' } },
    },
    actionSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description:
        '3.3: size of the built-in buttons and link — `sm` 32 px (3.2), `md` 42 px, `lg` 48.5 px (meets the 44 px touch target).',
      table: { defaultValue: { summary: 'sm' } },
    },
    linkTarget: {
      control: 'select',
      options: ['_blank', '_self'],
      description:
        '3.3: where `linkHref` opens — `_blank` (new tab, `rel="noopener noreferrer"`, the 3.2 behaviour) or `_self`.',
      table: { defaultValue: { summary: '_blank' } },
    },
    primaryLoading: { control: 'boolean' },
    primaryDisabled: { control: 'boolean' },
    announce: { control: 'boolean' },
  },
  parameters: {
    docs: {
      description: {
        component: `
Die eine Status- und Aktionsfläche einer Seite: „Wo steht das Ding, was ist der
eine nächste Schritt?"

**Key Features:**
- Tonale Akzent-Kante (4 px links) + getönte Icon-Bubble — ausschließlich Token-Farben
- Titel, Botschaft (String-Input oder Default-Slot für Markup)
- Primäraktion mit Loading/Disabled (**disabled ⇒ \`primaryDisabledReason\` ist Pflicht**,
  ohne Begründung gibt es eine Dev-Warnung), Ghost-Sekundäraktion mit Chevron,
  oder externer Link (\`linkLabel\`/\`linkHref\`) statt Primärbutton
- \`[slot='blockers']\`: Zeilenliste unter Subtle-Trenner (Punkt-Präfix) — jedes
  projizierte Element mit \`slot="blockers"\` wird eine eigene Zeile
- \`[slot='meta']\`: eine Fußzeile (Icon + Text)
- \`[slot='actions']\`: ersetzt die Button-Inputs vollständig
- \`[slot='body']\` (3.3): Inhalt unter der Botschaft ohne deren Textstile — Formularfelder,
  Listen und Beschreibungslisten behalten ihr eigenes Aussehen
- \`role="region"\` mit Titel als Label; \`announce\` meldet Titelwechsel via \`aria-live="polite"\`
- **Schmales Layout (3.3, TD-1):** unter 480 px Kartenbreite (Container Query auf dem Host)
  steht das Icon neben dem Titel, Botschaft, Body, Blocker und Meta nutzen die volle Breite,
  das Innen-Padding sinkt auf \`padding-md\`, und die Aktionen bekommen eine eigene Zeile, jede
  gestreckt. Eine projizierte \`fullWidth\`-Aktion bekommt bei jeder Breite eine eigene Zeile.
- **\`variant="soft"\` (3.3, LK-4):** die getönte Karte des „Weite“-Looks; \`actionsLayout="stacked"\`
  für mehrere gleich breite Aktionen; \`titleTag\` für eine Überschrift; \`actionSize\` und
  \`linkTarget\` für die eingebauten Aktionen.
- Der Host ist ein Size-Container (\`container-type: inline-size\`) und nimmt die volle Breite
  seines Elternelements ein.

**Nutzungsregeln:**
- Genau **eine** Karte pro Seite — sie ist die eine „nächster Schritt"-Fläche.
- Blocker sind Zeilen **in** der Karte (\`[slot='blockers']\`), nie zusätzliche Banner
  über oder unter der Karte.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<NextStepCardComponent>;

export const Default: Story = {
  args: {
    tone: 'warning',
    icon: 'clock',
    cardTitle: 'Wartet auf Freigabe',
    message: 'Der Entwurf ist vollständig: 8 Abschnitte, alle Prüfungen bestanden.',
    primaryLabel: 'Freigeben',
    secondaryLabel: 'Änderungen anfordern',
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-next-step-card
        [tone]="tone" [icon]="icon" [cardTitle]="cardTitle" [message]="message"
        [primaryLabel]="primaryLabel" [secondaryLabel]="secondaryLabel"
        [primaryLoading]="primaryLoading" [primaryDisabled]="primaryDisabled"
        [primaryDisabledReason]="primaryDisabledReason"
      />
    `,
  }),
};

export const AllTones: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <lc-next-step-card tone="neutral" icon="information-circle" cardTitle="Kein Handlungsbedarf" message="Alles läuft — es gibt gerade nichts zu tun." />
        <lc-next-step-card tone="primary" icon="pencil" cardTitle="Entwurf fortsetzen" message="Zwei Abschnitte sind noch offen." primaryLabel="Weiter bearbeiten" />
        <lc-next-step-card tone="success" icon="circle-check" cardTitle="Abgeschlossen" message="Alle Schritte sind erledigt." secondaryLabel="Zusammenfassung ansehen" />
        <lc-next-step-card tone="warning" icon="clock" cardTitle="Wartet auf Freigabe" message="Der Entwurf ist fertig und kann geprüft werden." primaryLabel="Freigeben" secondaryLabel="Änderungen anfordern" />
        <lc-next-step-card tone="info" icon="refresh" cardTitle="Verarbeitung läuft" message="Schritt 2 von 4 — das kann einige Minuten dauern." />
      </div>
    `,
  }),
};

export const WithBlockers: Story = {
  render: () => ({
    template: `
      <lc-next-step-card
        tone="warning" icon="clock" cardTitle="Startet, sobald die Voraussetzungen erfüllt sind"
        message="Zwei Punkte stehen noch aus."
        primaryLabel="Starten" [primaryDisabled]="true"
        primaryDisabledReason="Erst möglich, wenn beide Blocker gelöst sind"
      >
        <span slot="blockers">Abschnitt B wartet auf eine Entscheidung.</span>
        <span slot="blockers">Die Prüfung von Abschnitt C läuft noch.</span>
      </lc-next-step-card>
    `,
  }),
};

export const WithMetaLine: Story = {
  render: () => ({
    template: `
      <lc-next-step-card
        tone="warning" icon="clock" cardTitle="Wartet auf Freigabe"
        message="Der Entwurf ist fertig — jedes Kriterium ist abgedeckt."
        primaryLabel="Freigeben" secondaryLabel="Änderungen anfordern"
      >
        <span slot="meta">
          <lc-icon name="circle-check" size="xs" [decorative]="true" />
          Konsistenzprüfung: keine offenen Befunde
        </span>
      </lc-next-step-card>
    `,
  }),
};

export const ExternalLink: Story = {
  render: () => ({
    template: `
      <lc-next-step-card
        tone="success" icon="circle-check" cardTitle="Zur Prüfung eingereicht"
        message="Das Ergebnis liegt im externen System bereit."
        linkLabel="Vorgang ansehen" linkHref="https://example.com/"
        secondaryLabel="Details"
      />
    `,
  }),
};

export const CustomActionsSlot: Story = {
  render: () => ({
    template: `
      <lc-next-step-card
        tone="primary" icon="help-circle" cardTitle="Eine Rückfrage ist offen"
        message="Die Antwort entscheidet, wie es weitergeht."
      >
        <div slot="actions" style="display: flex; gap: 0.5rem;">
          <lc-button variant="outline" size="sm">Option A</lc-button>
          <lc-button variant="outline" size="sm">Option B</lc-button>
        </div>
      </lc-next-step-card>
    `,
  }),
};

export const LoadingPrimary: Story = {
  render: () => ({
    template: `
      <lc-next-step-card
        tone="primary" icon="pencil" cardTitle="Wird gestartet"
        message="Die Aktion läuft bereits."
        primaryLabel="Starten" [primaryLoading]="true"
      />
    `,
  }),
};

// ── 3.3 ────────────────────────────────────────────────────────────────────

/** The "Weite" card: tinted fill per tone, no rail, border or shadow, a white bubble with a ring. */
export const Soft: Story = {
  args: {
    variant: 'soft',
    tone: 'primary',
    icon: 'plus',
    cardTitle: 'Lade deine Partnerin oder deinen Partner ein',
    message: 'Eine Person kann den Link 7 Tage lang nutzen.',
    titleTag: 'h2',
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-next-step-card
        [variant]="variant" [tone]="tone" [icon]="icon" [cardTitle]="cardTitle"
        [message]="message" [titleTag]="titleTag" [announce]="true"
      >
        <lc-button slot="actions" variant="primary" size="lg" [fullWidth]="true">Einladen</lc-button>
      </lc-next-step-card>
    `,
  }),
};

/** Every tone in the soft variant, with a meta line and an outline action. */
export const SoftTones: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <lc-next-step-card variant="soft" tone="neutral" icon="check" cardTitle="Alles erledigt" />
        <lc-next-step-card variant="soft" tone="primary" icon="clock" cardTitle="Deine Einladung ist unterwegs">
          <span slot="meta">Gültig bis Mo., 19. Okt., 20:30 Uhr</span>
          <lc-button slot="actions" variant="outline" size="lg">Einladung verwalten</lc-button>
        </lc-next-step-card>
        <lc-next-step-card variant="soft" tone="success" icon="check" cardTitle="Assistent ist verbunden" message="Er kann lesen, aber nichts ändern." />
        <lc-next-step-card variant="soft" tone="warning" icon="home" cardTitle="Du bist schon in einem Haushalt" message="Wenn du beitrittst, verlässt du deinen Haushalt." />
        <lc-next-step-card variant="soft" tone="info" icon="arrow-path" cardTitle="Wird abgeglichen" message="Das dauert meist weniger als eine Minute." />
      </div>
    `,
  }),
};

/**
 * Narrow layout (TD-1) at phone width: icon beside the title, text at full
 * width, the action in its own row and stretched. Same markup, no input.
 */
export const NarrowOnPhone: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 2rem; flex-wrap: wrap; align-items: flex-start;">
        <div style="width: 312px;">
          <lc-next-step-card variant="soft" tone="primary" icon="user" cardTitle="Lena Brandt möchte beitreten">
            <span slot="meta">lena.brandt&#64;example.com · per E-Mail · heute 18:05</span>
            <a lcButton slot="actions" variant="primary" size="lg" href="#">Anfrage prüfen</a>
          </lc-next-step-card>
        </div>
        <div style="width: 312px;">
          <lc-next-step-card tone="warning" icon="clock" cardTitle="Wartet auf Freigabe"
            message="Der Entwurf ist vollständig." primaryLabel="Freigeben" secondaryLabel="Später" actionSize="lg" />
        </div>
      </div>
    `,
  }),
};

/** actionsLayout="stacked": several actions, one per line at equal width, 8 px apart. */
export const StackedActions: Story = {
  render: () => ({
    template: `
      <div style="max-width: 440px;">
        <lc-next-step-card variant="soft" tone="primary" icon="home" cardTitle="Noch kein Haushalt" actionsLayout="stacked">
          <lc-button slot="actions" variant="primary" size="lg">Haushalt einrichten</lc-button>
          <lc-button slot="actions" variant="outline" size="lg">Um eine Einladung bitten</lc-button>
        </lc-next-step-card>
      </div>
    `,
  }),
};

/** [slot='body'] for a form: the field keeps its own text styles. */
export const FormInBody: Story = {
  render: () => ({
    template: `
      <div style="max-width: 440px;">
        <lc-next-step-card variant="soft" tone="primary" icon="home" cardTitle="Wie heißt euer Haushalt?">
          <label slot="body" style="display: flex; flex-direction: column; gap: 0.25rem;">
            Name
            <input type="text" autocomplete="off" style="font: inherit; padding: 0.5rem;" />
          </label>
          <lc-button slot="actions" variant="primary" size="lg" [fullWidth]="true">Speichern</lc-button>
        </lc-next-step-card>
      </div>
    `,
  }),
};

/** Built-in actions at 48.5 px (`actionSize="lg"`) and a link that stays in the tab. */
export const LargeBuiltInActions: Story = {
  render: () => ({
    template: `
      <lc-next-step-card
        tone="primary" icon="light-bulb" cardTitle="Neu: Verträge"
        message="Verträge werden aus Lastschriften erkannt."
        linkLabel="Mehr erfahren" linkHref="/neu" linkTarget="_self"
        secondaryLabel="Später" actionSize="lg"
      />
    `,
  }),
};

