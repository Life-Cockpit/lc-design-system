import type { Meta, StoryObj } from '@storybook/angular';
import { CodeBlockComponent } from './code-block.component';

const meta: Meta<CodeBlockComponent> = {
  title: 'Data Display/Code Block',
  component: CodeBlockComponent,
  argTypes: {
    language: {
      control: 'select',
      options: ['typescript', 'javascript', 'html', 'css', 'scss', 'json', 'bash', 'python', 'java', 'text'],
      description: 'Language of the highlighting; also the header label and region name when no filename is set',
      table: { defaultValue: { summary: 'text' } },
    },
    showLineNumbers: {
      control: 'boolean',
      description: 'Whether to show line numbers',
      table: { defaultValue: { summary: 'true' } },
    },
    showCopy: {
      control: 'boolean',
      description: 'Whether to show the copy button',
      table: { defaultValue: { summary: 'true' } },
    },
    showHeader: {
      control: 'boolean',
      description: 'Whether the code block has a header bar',
      table: { defaultValue: { summary: 'true' } },
    },
    regionLabel: {
      control: 'text',
      description:
        'Accessible name of the scrollable code region (`role="region"`). When it is unset or empty, the `filename` is used, then the `language`. Set a short, localised name that is unique on the page, such as "Befehl für Claude Code". Not used when `wrap` is set.',
      table: { defaultValue: { summary: 'filename, then language' } },
    },
    wrap: {
      control: 'boolean',
      description:
        "Wraps long lines (`white-space: pre-wrap`, breaking anywhere if needed) instead of scrolling sideways. A wrapped block doesn't scroll, so its body is neither a tab stop nor a region.",
      table: { defaultValue: { summary: 'false' } },
    },
  },

  parameters: {
    docs: {
      description: {
        component: `
Code block component for displaying syntax-highlighted source code.

**Key Features:**
- Syntax highlighting for 10+ languages (TypeScript, Python, Java, etc.)
- Optional line numbers
- Copy-to-clipboard button
- Optional header with filename and language label
- Dark-mode compatible color scheme
- Keyboard: the body is a focusable, named region that scrolls with the arrow keys; \`wrap\` wraps instead
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<CodeBlockComponent>;

/** 240 characters: wider than the body at 360, 1024 and 1280 px (3.7, AS-21). */
const LONG_COMMAND =
  'claude mcp add --transport http --scope user --client-id 3f9c2a7e-5b1d-4e8a-9c0f-2d6b8a1e7f43 --callback-port 33418 --header X-LifeCorner-Locale:de-DE lifecorner https://mcp.life-cockpit.de/v1/mcp/households/wohngemeinschaft-mueller-schmidt';

/** 400 characters, for the wrapped story. */
const WRAP_COMMAND = `${LONG_COMMAND}/features/einkaufsliste,aufgaben,kalender,notizen,dokumente,kontakte,essensplanung,haushaltsbuch,geburtstage,erinnerungen,vertragsverwaltung,reinigungsplan,post`;

export const TypeScript: Story = {
  args: {
    code: `import { Component, input } from '@angular/core';

@Component({
  selector: 'lc-example',
  standalone: true,
  template: \`<p>{{ message() }}</p>\`,
})
export class ExampleComponent {
  message = input.required<string>();
}`,
    language: 'typescript',
    filename: 'example.component.ts',
    showLineNumbers: true,
    showCopy: true,
    showHeader: true,
  },
};

export const JSON: Story = {
  args: {
    code: `{
  "name": "@lifecorner/angular-ui-kit",
  "version": "1.0.0",
  "dependencies": {
    "@angular/core": "^19.0.0"
  }
}`,
    language: 'json',
    filename: 'package.json',
  },
};

export const Bash: Story = {
  args: {
    code: `npm install @lifecorner/angular-ui-kit
npx nx build angular-ui-kit
npx nx test angular-ui-kit`,
    language: 'bash',
    showLineNumbers: false,
  },
};

export const NoHeader: Story = {
  args: {
    code: `const sum = (a: number, b: number) => a + b;`,
    language: 'typescript',
    showHeader: false,
  },
};

export const HTML: Story = {
  args: {
    code: `<lc-button variant="primary" size="md">
  Click me
</lc-button>

<lc-card>
  <h3>Title</h3>
  <p>Content goes here</p>
</lc-card>`,
    language: 'html',
  },
};

export const Python: Story = {
  args: {
    code: `from dataclasses import dataclass
from typing import Optional

@dataclass
class User:
    name: str
    age: int
    email: Optional[str] = None

    def greet(self) -> str:
        """Return a greeting message."""
        return f"Hello, {self.name}!"

    @staticmethod
    def validate_age(age: int) -> bool:
        return 0 < age < 150

# Create a user
user = User(name="Alice", age=30)
print(user.greet())  # Hello, Alice!

for i in range(5):
    if i % 2 == 0:
        print(f"{i} is even")`,
    language: 'python',
    filename: 'models.py',
  },
};

export const Java: Story = {
  args: {
    code: `import java.util.List;
import java.util.stream.Collectors;

public class UserService {
    private final List<User> users;

    public UserService(List<User> users) {
        this.users = users;
    }

    /**
     * Find all active users older than the given age.
     */
    public List<User> findActiveUsers(int minAge) {
        return users.stream()
            .filter(u -> u.isActive() && u.getAge() > minAge)
            .sorted((a, b) -> a.getName().compareTo(b.getName()))
            .collect(Collectors.toList());
    }

    @Override
    public String toString() {
        return "UserService{count=" + users.size() + "}";
    }
}`,
    language: 'java',
    filename: 'UserService.java',
  },
};

export const LongCommand: Story = {
  args: {
    code: LONG_COMMAND,
    language: 'bash',
    filename: 'Terminal',
    showLineNumbers: false,
    regionLabel: 'Command for Claude Code',
    copyLabel: 'Copy',
    copyAriaLabel: 'Copy command',
    copiedLabel: 'Copied',
    copiedAnnouncement: 'Command copied',
  },
  parameters: {
    docs: {
      description: {
        story:
          'A line wider than the block scrolls inside the body, which is a named region and a tab stop after the copy button: focus it and scroll with the arrow keys. Set a unique, localised `regionLabel`.',
      },
    },
  },
};

export const LongCommandGerman: Story = {
  args: {
    ...LongCommand.args,
    regionLabel: 'Befehl für Claude Code',
    copyLabel: 'Kopieren',
    copyAriaLabel: 'Befehl kopieren',
    copiedLabel: 'Kopiert',
    copiedAnnouncement: 'Befehl kopiert',
  },
  parameters: {
    docs: {
      description: {
        story: 'The same region with a German name and German copy labels.',
      },
    },
  },
};

export const Wrapped: Story = {
  args: {
    code: `claude mcp list\n${WRAP_COMMAND}\nclaude mcp get lifecorner`,
    language: 'bash',
    filename: 'Terminal',
    showLineNumbers: true,
    wrap: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'With `wrap`, long lines wrap instead of scrolling; the line number stays on the first row. Nothing scrolls, so the body is neither a tab stop nor a region.',
      },
    },
  },
};
