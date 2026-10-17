/**
 * LifeCorner Design System (UI Kit)
 *
 * Public API for the design system library: the primary entry
 * `@lifecorner/angular-ui-kit` re-exports every public secondary entry
 * (`@lifecorner/angular-ui-kit/<entry>`, one per folder of `src/lib/`). Import
 * from the secondary entries to keep unused parts out of an app and to let
 * lazy routes take kit parts with them (3.5, gap AS-15); this entry keeps
 * working unchanged.
 *
 * To use global styles, import in your Angular application's styles.scss:
 * @import '@lifecorner/angular-ui-kit/styles/index.scss';
 */

// ============================================================================
// Design Tokens
// ============================================================================
// Import all generated token constants (colors, spacing, typography, etc.)
export * from '@lifecorner/angular-ui-kit/tokens';

// ============================================================================
// Theme System
// ============================================================================
// Theme types and the theme service for light/dark mode switching
export * from '@lifecorner/angular-ui-kit/theme';

// ============================================================================
// Models & Interfaces
// ============================================================================
// Navigation Item interface
export * from '@lifecorner/angular-ui-kit/models';

// ============================================================================
// Components
// ============================================================================
// Accordion Component
export * from '@lifecorner/angular-ui-kit/accordion';

// Button Component
export * from '@lifecorner/angular-ui-kit/button';

// Card Component
export * from '@lifecorner/angular-ui-kit/card';

// Checkbox Component
export * from '@lifecorner/angular-ui-kit/checkbox';

// Icon Component
export * from '@lifecorner/angular-ui-kit/icon';
// The canonical icon name list (ICON_NAMES, isValidIconName)
export * from '@lifecorner/angular-ui-kit/icon-names';

// Logo Component
export * from '@lifecorner/angular-ui-kit/logo';

// Menu Component
export * from '@lifecorner/angular-ui-kit/menu';

// Input Component
export * from '@lifecorner/angular-ui-kit/input';

// Radio Component, Radio Group Component (fieldset + legend around lc-radio)
export * from '@lifecorner/angular-ui-kit/radio';

// Typography Component
export * from '@lifecorner/angular-ui-kit/typography';

// ============================================================================
// Form Components
// ============================================================================
// DatePicker Component
export * from '@lifecorner/angular-ui-kit/datepicker';

// Select Component
export * from '@lifecorner/angular-ui-kit/select';

// Switch Component
export * from '@lifecorner/angular-ui-kit/switch';

// Textarea Component
export * from '@lifecorner/angular-ui-kit/textarea';

// Password Input Component
export * from '@lifecorner/angular-ui-kit/password-input';

// Verification Code Input Component
export * from '@lifecorner/angular-ui-kit/verification-code-input';

// Email Input Component
export * from '@lifecorner/angular-ui-kit/email-input';

// Hero Component
export * from '@lifecorner/angular-ui-kit/hero';

// Progress Bar Component
export * from '@lifecorner/angular-ui-kit/progress-bar';

// Divider Component
export * from '@lifecorner/angular-ui-kit/divider';

// Search Input Component
export * from '@lifecorner/angular-ui-kit/search-input';

// File Upload Component
export * from '@lifecorner/angular-ui-kit/file-upload';

// Popover Component
export * from '@lifecorner/angular-ui-kit/popover';

// 3.3: forms & sign-in
// Provider Button Component (Sign in with Google)
export * from '@lifecorner/angular-ui-kit/provider-button';
// Copy Field Component (read-only value + copy button)
export * from '@lifecorner/angular-ui-kit/copy-field';

// ============================================================================
// Layout Components
// ============================================================================
// Container Component
export * from '@lifecorner/angular-ui-kit/container';

// Page Header Component
export * from '@lifecorner/angular-ui-kit/page-header';

// Page Layout Component
export * from '@lifecorner/angular-ui-kit/page-layout';

// Section Component
export * from '@lifecorner/angular-ui-kit/section';

// Spacer Component
export * from '@lifecorner/angular-ui-kit/spacer';

// Split Pane Component
export * from '@lifecorner/angular-ui-kit/split-pane';

// Stack Component
export * from '@lifecorner/angular-ui-kit/stack';

// Toolbar Component
export * from '@lifecorner/angular-ui-kit/toolbar';

// ============================================================================
// Feedback Components
// ============================================================================
// Alert Component
export * from '@lifecorner/angular-ui-kit/alert';

// Error Display Component
export * from '@lifecorner/angular-ui-kit/error-display';

// Toast Service, Component and Outlet
export * from '@lifecorner/angular-ui-kit/toast';

// Modal Component
export * from '@lifecorner/angular-ui-kit/modal';

// Tooltip Directive
export * from '@lifecorner/angular-ui-kit/tooltip';

// ============================================================================
// Navigation Components
// ============================================================================
// Breadcrumbs Component
export * from '@lifecorner/angular-ui-kit/breadcrumbs';

// Header Component
export * from '@lifecorner/angular-ui-kit/header';

// Pagination Component
export * from '@lifecorner/angular-ui-kit/pagination';

// Sidenav Component
export * from '@lifecorner/angular-ui-kit/sidenav';

// Tabs Component
export * from '@lifecorner/angular-ui-kit/tabs';

// 3.3: navigation & layout
// Bottom Nav Component (phone and tablet navigation bar)
export * from '@lifecorner/angular-ui-kit/bottom-nav';
// App Shell and App Page Components (the app frame; the page with its right column)
export * from '@lifecorner/angular-ui-kit/app-shell';

// ============================================================================
// Data Display Components
// ============================================================================
// Avatar Component
export * from '@lifecorner/angular-ui-kit/avatar';

// Badge Component
export * from '@lifecorner/angular-ui-kit/badge';

// Status Dot Component
export * from '@lifecorner/angular-ui-kit/status-dot';

// ToggleGroup Component
export * from '@lifecorner/angular-ui-kit/toggle-group';

// List Component
export * from '@lifecorner/angular-ui-kit/list';

// Chip Component
export * from '@lifecorner/angular-ui-kit/chip';

// Table Component
export * from '@lifecorner/angular-ui-kit/table';

// Field Group Component
export * from '@lifecorner/angular-ui-kit/field-group';

// Stepper Component
export * from '@lifecorner/angular-ui-kit/stepper';

// FilterBar Component
export * from '@lifecorner/angular-ui-kit/filter-bar';

// Spinner Component
export * from '@lifecorner/angular-ui-kit/spinner';

// Skeleton Component
export * from '@lifecorner/angular-ui-kit/skeleton';

// Empty State Component
export * from '@lifecorner/angular-ui-kit/empty-state';

// Drawer Component
export * from '@lifecorner/angular-ui-kit/drawer';

// Timeline Component
export * from '@lifecorner/angular-ui-kit/timeline';

// Avatar Group Component
export * from '@lifecorner/angular-ui-kit/avatar-group';

// Slider Component
export * from '@lifecorner/angular-ui-kit/slider';

// Number Input Component
export * from '@lifecorner/angular-ui-kit/number-input';

// Callout Component
export * from '@lifecorner/angular-ui-kit/callout';

// Next Step Card Component
export * from '@lifecorner/angular-ui-kit/next-step-card';

// Choice Prompt Component
export * from '@lifecorner/angular-ui-kit/choice-prompt';

// Rating Component
export * from '@lifecorner/angular-ui-kit/rating';

// Color Picker Component
export * from '@lifecorner/angular-ui-kit/color-picker';

// Code Block Component
export * from '@lifecorner/angular-ui-kit/code-block';

// Footer Component
export * from '@lifecorner/angular-ui-kit/footer';

// ============================================================================
// Chart Components
// ============================================================================
// Sparkline Component
export * from '@lifecorner/angular-ui-kit/sparkline';

// Stat Trend Component
export * from '@lifecorner/angular-ui-kit/stat-trend';

// Donut Chart Component
export * from '@lifecorner/angular-ui-kit/donut-chart';

// Bar Chart Component
export * from '@lifecorner/angular-ui-kit/bar-chart';

// Line Chart Component
export * from '@lifecorner/angular-ui-kit/line-chart';

// Gauge Component
export * from '@lifecorner/angular-ui-kit/gauge';

// Stacked Bar Chart Component
export * from '@lifecorner/angular-ui-kit/stacked-bar-chart';

// Area Chart Component
export * from '@lifecorner/angular-ui-kit/area-chart';

// Heatmap Component
export * from '@lifecorner/angular-ui-kit/heatmap';

// Pie Chart Component
export * from '@lifecorner/angular-ui-kit/pie-chart';

// Radar Chart Component
export * from '@lifecorner/angular-ui-kit/radar-chart';

// Progress Ring Component
export * from '@lifecorner/angular-ui-kit/progress-ring';

// Waterfall Chart Component
export * from '@lifecorner/angular-ui-kit/waterfall-chart';

// ============================================================================
// Complex Components
// ============================================================================
// Calendar Component
export * from '@lifecorner/angular-ui-kit/calendar';

// Gantt Chart Component
export * from '@lifecorner/angular-ui-kit/gantt-chart';

// Chat Component
export * from '@lifecorner/angular-ui-kit/chat';

// Document Viewer Component
export * from '@lifecorner/angular-ui-kit/document-viewer';

// Gallery Component
export * from '@lifecorner/angular-ui-kit/gallery';

// Dependency Viewer Component
export * from '@lifecorner/angular-ui-kit/dependency-viewer';

// Tree View Component
export * from '@lifecorner/angular-ui-kit/tree-view';

// Scatter Plot Component
export * from '@lifecorner/angular-ui-kit/scatter-plot';

// Funnel Chart Component
export * from '@lifecorner/angular-ui-kit/funnel-chart';

// Tag Input Component
export * from '@lifecorner/angular-ui-kit/tag-input';

// Date Range Picker Component
export * from '@lifecorner/angular-ui-kit/date-range-picker';

// Diff Viewer Component
export * from '@lifecorner/angular-ui-kit/diff-viewer';

// Kanban Board Component
export * from '@lifecorner/angular-ui-kit/kanban-board';

// Notification Center Component
export * from '@lifecorner/angular-ui-kit/notification-center';

// Rich Text Editor Component
export * from '@lifecorner/angular-ui-kit/rich-text-editor';

// Markdown Component
export * from '@lifecorner/angular-ui-kit/markdown';

// Log Viewer Component
export * from '@lifecorner/angular-ui-kit/log-viewer';

// Confirm Dialog Component & Service
export * from '@lifecorner/angular-ui-kit/confirm-dialog';

// Combobox Component
export * from '@lifecorner/angular-ui-kit/combobox';

// Stage List Component
export * from '@lifecorner/angular-ui-kit/stage-list';

// Description List Component
export * from '@lifecorner/angular-ui-kit/description-list';

// Pipeline Component
export * from '@lifecorner/angular-ui-kit/pipeline';

// ============================================================================
// Styles
// ============================================================================
// Styles are not exported from TypeScript.
// Import path: '@lifecorner/angular-ui-kit/styles/index.scss'
