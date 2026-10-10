import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { withThemeByClassName } from '@storybook/addon-themes';
import { create } from 'storybook/theming/create';
import type { Preview } from '@storybook/angular';

// Import all components so render templates in stories can use any selector
import { AccordionComponent } from '../src/lib/accordion/accordion.component';
import { AlertComponent } from '../src/lib/alert/alert.component';
import { AvatarComponent } from '../src/lib/avatar/avatar.component';
import { BadgeComponent } from '../src/lib/badge/badge.component';
import { BreadcrumbsComponent } from '../src/lib/breadcrumbs/breadcrumbs.component';
import { ButtonComponent } from '../src/lib/button/button.component';
import { CardComponent } from '../src/lib/card/card.component';
import { CheckboxComponent } from '../src/lib/checkbox/checkbox.component';
import { ChipComponent } from '../src/lib/chip/chip.component';
import { ContainerComponent } from '../src/lib/container/container.component';
import { DatepickerComponent } from '../src/lib/datepicker/datepicker.component';
import { DrawerComponent } from '../src/lib/drawer/drawer.component';
import { EmailInputComponent } from '../src/lib/email-input/email-input.component';
import { EmptyStateComponent } from '../src/lib/empty-state/empty-state.component';
import { ErrorDisplayComponent } from '../src/lib/error-display/error-display.component';
import { FieldGroupComponent } from '../src/lib/field-group/field-group.component';
import { FilterBarComponent } from '../src/lib/filter-bar/filter-bar.component';
import { HeaderComponent } from '../src/lib/header/header.component';
import { IconComponent } from '../src/lib/icon/icon.component';
import { InputComponent } from '../src/lib/input/input.component';
import { ListComponent } from '../src/lib/list/list.component';
import { LogoComponent } from '../src/lib/logo/logo.component';
import { MenuComponent } from '../src/lib/menu/menu.component';
import { ModalComponent } from '../src/lib/modal/modal.component';
import { PaginationComponent } from '../src/lib/pagination/pagination.component';
import { PasswordInputComponent } from '../src/lib/password-input/password-input.component';
import { RadioComponent } from '../src/lib/radio/radio.component';
import { SectionComponent } from '../src/lib/section/section.component';
import { SelectComponent } from '../src/lib/select/select.component';
import { SidenavComponent } from '../src/lib/sidenav/sidenav.component';
import { SkeletonComponent } from '../src/lib/skeleton/skeleton.component';
import { SpacerComponent } from '../src/lib/spacer/spacer.component';
import { SpinnerComponent } from '../src/lib/spinner/spinner.component';
import { StackComponent } from '../src/lib/stack/stack.component';
import { StepperComponent } from '../src/lib/stepper/stepper.component';
import { SwitchComponent } from '../src/lib/switch/switch.component';
import { TabComponent, TabsComponent } from '../src/lib/tabs/tabs.component';
import { TableComponent } from '../src/lib/table/table.component';
import { TextareaComponent } from '../src/lib/textarea/textarea.component';
import { ToastComponent } from '../src/lib/toast/toast.component';
import { ToggleGroupComponent } from '../src/lib/toggle-group/toggle-group.component';
import { TooltipDirective } from '../src/lib/tooltip/tooltip.directive';
import { TypographyComponent } from '../src/lib/typography/typography.component';
import { VerificationCodeInputComponent } from '../src/lib/verification-code-input/verification-code-input.component';

// DS2.0 is dark-first — autodocs renders on a dark canvas so component previews
// sit on the same teal-tinted dark surface as the app.
const lcDocsTheme = create({
  base: 'dark',
  colorPrimary: '#84c7d4',
  colorSecondary: '#84c7d4',
  appBg: '#111827',
  appContentBg: '#14222e',
  appPreviewBg: '#111827',
  barBg: '#14222e',
  textColor: '#eef4f6',
  textMutedColor: '#aebfc7',
  fontBase: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontCode: '"Fira Code", "JetBrains Mono", monospace',
});

const preview: Preview = {
  tags: ['autodocs', '!dev'],
  decorators: [
    moduleMetadata({
      imports: [
        AccordionComponent,
        AlertComponent,
        AvatarComponent,
        BadgeComponent,
        BreadcrumbsComponent,
        ButtonComponent,
        CardComponent,
        CheckboxComponent,
        ChipComponent,
        ContainerComponent,
        DatepickerComponent,
        DrawerComponent,
        EmailInputComponent,
        EmptyStateComponent,
        ErrorDisplayComponent,
        FieldGroupComponent,
        FilterBarComponent,
        HeaderComponent,
        IconComponent,
        InputComponent,
        ListComponent,
        LogoComponent,
        MenuComponent,
        ModalComponent,
        PaginationComponent,
        PasswordInputComponent,
        RadioComponent,
        SectionComponent,
        SelectComponent,
        SidenavComponent,
        SkeletonComponent,
        SpacerComponent,
        SpinnerComponent,
        StackComponent,
        StepperComponent,
        SwitchComponent,
        TabComponent,
        TabsComponent,
        TableComponent,
        TextareaComponent,
        ToastComponent,
        ToggleGroupComponent,
        TooltipDirective,
        TypographyComponent,
        VerificationCodeInputComponent,
      ],
    }),
    applicationConfig({
      providers: [provideHttpClient(withXhr()), provideAnimations(), provideRouter([])],
    }),
    withThemeByClassName({
      themes: {
        dark: 'dark',
        light: 'light',
      },
      // DS2.0 is dark-first — the preview defaults to dark.
      defaultTheme: 'dark',
      parentSelector: ':root',
    }),
  ],
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#111827' },
        { name: 'light', value: '#ffffff' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      theme: lcDocsTheme,
      source: {
        type: 'dynamic',
        state: 'open',
      },
      canvas: {
        sourceState: 'shown',
      },
    },
    options: {
      storySort: {
        method: 'alphabetical',
        order: [
          'Installation',
          'Design Tokens',
          ['Colors', 'Spacing', 'Typography', 'Elevation', 'Sizes & Animation'],
          'Components',
          'Editors',
          'Form',
          'Data Display',
          'Charts',
          'Feedback',
          'Navigation',
          'Layout',
          '*',
        ],
      },
    },
  },
};

export default preview;
