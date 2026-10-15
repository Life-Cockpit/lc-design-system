import type { Meta, StoryObj } from '@storybook/angular';
import { CodeBlockComponent } from './code-block.component';

const meta: Meta<CodeBlockComponent> = {
  title: 'Data Display/Code Block',
  component: CodeBlockComponent,
  argTypes: {
    language: {
      control: 'select',
      options: ['typescript', 'javascript', 'html', 'css', 'scss', 'json', 'bash', 'python', 'java', 'text'],
    },
    showLineNumbers: { control: 'boolean' },
    showCopy: { control: 'boolean' },
    showHeader: { control: 'boolean' },
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
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<CodeBlockComponent>;

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
