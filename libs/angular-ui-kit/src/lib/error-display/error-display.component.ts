import { Component, ChangeDetectionStrategy, input, computed, signal, effect } from '@angular/core';
import { AlertComponent, AlertVariant } from '../alert/alert.component';

/**
 * Maps common Cognito error codes to user-friendly messages
 */
const COGNITO_ERROR_MESSAGES: Record<string, string> = {
  // Sign Up Errors
  UsernameExistsException: 'An account with this email already exists.',
  InvalidPasswordException:
    'Password must be at least 8 characters with uppercase, lowercase, number, and special character.',
  InvalidParameterException: 'Invalid input. Please check your information and try again.',

  // Sign In Errors
  UserNotFoundException: 'No account found with this email address.',
  NotAuthorizedException: 'Incorrect email or password.',
  UserNotConfirmedException: 'Please verify your email address before signing in.',
  PasswordResetRequiredException: 'You must reset your password before continuing.',

  // Confirmation Errors
  CodeMismatchException: 'Invalid verification code. Please try again.',
  ExpiredCodeException: 'Verification code has expired. Please request a new one.',

  // Password Reset Errors
  LimitExceededException: 'Too many attempts. Please try again later.',
  TooManyRequestsException: 'Too many requests. Please wait a moment and try again.',
  TooManyFailedAttemptsException:
    'Too many failed attempts. Your account has been temporarily locked.',

  // Token Errors
  NotAuthorizedException_TokenExpired: 'Your session has expired. Please sign in again.',

  // General Errors
  NetworkError: 'Network error. Please check your connection and try again.',
  UnknownError: 'An unexpected error occurred. Please try again.',
};

/**
 * Error severity levels
 */
export type ErrorSeverity = 'error' | 'warning' | 'info';

/**
 * Error display component for authentication and application error messages.
 *
 * Features:
 * - Automatic Cognito error code mapping to user-friendly messages
 * - Severity levels (error, warning, info)
 * - Custom error message override
 * - Dismissible with close button
 * - Accepts Error objects or custom error shapes
 *
 * @example
 * ```html
 * <lc-error-display [error]="cognitoError" [dismissible]="true" />
 * <lc-error-display message="Invalid credentials" severity="error" />
 * ```
 */
@Component({
  selector: 'lc-error-display',
  imports: [AlertComponent],
  templateUrl: './error-display.component.html',
  styleUrl: './error-display.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorDisplayComponent {
  /**
   * Error object (Cognito or generic Error)
   */
  readonly error = input<Error | { code?: string; message?: string } | null>();

  /**
   * Custom error message (overrides error.message)
   */
  readonly message = input<string>();

  /**
   * Error severity level
   * @default 'error'
   */
  readonly severity = input<ErrorSeverity>('error');

  /**
   * Title for the error display
   */
  readonly title = input<string>();

  /**
   * Whether the error can be dismissed
   * @default true
   */
  readonly dismissible = input<boolean>(true);

  /**
   * Whether to show icon
   * @default true
   */
  readonly showIcon = input<boolean>(true);

  /**
   * Whether to automatically hide after a delay
   * @default false
   */
  readonly autoDismiss = input<boolean>(false);

  /**
   * Auto-dismiss delay in milliseconds
   * @default 5000
   */
  readonly autoDismissDelay = input<number>(5000);

  /** Default title for severity `error` (when no `title` is set). */
  readonly errorTitleLabel = input('Error');

  /** Default title for severity `warning`. */
  readonly warningTitleLabel = input('Warning');

  /** Default title for severity `info`. */
  readonly infoTitleLabel = input('Information');

  /**
   * Internal visibility state
   */
  protected readonly visible = signal<boolean>(false);

  /**
   * Computed error message
   */
  protected readonly errorMessage = computed(() => {
    // Custom message takes precedence
    if (this.message()) return this.message();

    const err = this.error();
    if (!err) return '';

    // Try to extract Cognito error code
    const errorCode = 'code' in err ? err.code : undefined;
    if (errorCode && COGNITO_ERROR_MESSAGES[errorCode]) {
      return COGNITO_ERROR_MESSAGES[errorCode];
    }

    // Fallback to error message
    if ('message' in err && err.message) {
      return err.message;
    }

    return COGNITO_ERROR_MESSAGES['UnknownError'];
  });

  /**
   * Computed alert variant based on severity
   */
  protected readonly alertVariant = computed((): AlertVariant => {
    const severity = this.severity();
    if (severity === 'warning') return 'warning';
    if (severity === 'info') return 'info';
    return 'error';
  });

  /**
   * Computed title for the error
   */
  protected readonly errorTitle = computed(() => {
    if (this.title()) return this.title();

    const severity = this.severity();
    if (severity === 'warning') return this.warningTitleLabel();
    if (severity === 'info') return this.infoTitleLabel();
    return this.errorTitleLabel();
  });

  /**
   * Auto-dismiss timer
   */
  private autoDismissTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    // Show/hide based on error presence
    effect(() => {
      const hasError = !!(this.error() || this.message());
      this.visible.set(hasError);

      // Setup auto-dismiss if enabled
      if (hasError && this.autoDismiss()) {
        this.clearAutoDismissTimer();
        this.autoDismissTimer = setTimeout(() => {
          this.visible.set(false);
        }, this.autoDismissDelay());
      }
    });
  }

  /**
   * Handle alert dismissed
   */
  protected onDismissed(): void {
    this.visible.set(false);
    this.clearAutoDismissTimer();
  }

  /**
   * Clear auto-dismiss timer
   */
  private clearAutoDismissTimer(): void {
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = undefined;
    }
  }
}
