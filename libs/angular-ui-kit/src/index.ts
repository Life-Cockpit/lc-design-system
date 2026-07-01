/**
 * Life-Cockpit Design System (UI Kit)
 *
 * Public API for the design system library.
 *
 * To use global styles, import in your Angular application's styles.scss:
 * @import '@life-cockpit/angular-ui-kit/styles/index.scss';
 */

// ============================================================================
// Design Tokens
// ============================================================================
// Import all generated token constants (colors, spacing, typography, etc.)
export * from './lib/tokens';

// ============================================================================
// Theme System
// ============================================================================
// Theme types for TypeScript type safety
export * from './lib/theme/theme.types';

// Theme service for light/dark mode switching
export * from './lib/theme/theme.service';

// ============================================================================
// Models & Interfaces
// ============================================================================
// Navigation Item interface
export * from './lib/models/navigation-item.interface';

// ============================================================================
// Components
// ============================================================================
// Accordion Component
export * from './lib/accordion/accordion.component';
export * from './lib/accordion/accordion-group.component';
export * from './lib/accordion/accordion-header.directive';
export * from './lib/accordion/accordion-content.directive';

// Button Component
export * from './lib/button/button.component';

// Card Component
export * from './lib/card/card.component';

// Checkbox Component
export * from './lib/checkbox/checkbox.component';

// Icon Component
export * from './lib/icon/icon.component';

// Logo Component
export * from './lib/logo/logo.component';

// Menu Component
export * from './lib/menu/menu.component';

// Input Component
export * from './lib/input/input.component';

// Radio Component
export * from './lib/radio/radio.component';

// Typography Component
export * from './lib/typography/typography.component';

// ============================================================================
// Form Components
// ============================================================================
// DatePicker Component
export * from './lib/datepicker/datepicker.component';

// Select Component
export * from './lib/select/select.component';

// Switch Component
export * from './lib/switch/switch.component';

// Textarea Component
export * from './lib/textarea/textarea.component';

// Password Input Component
export * from './lib/password-input/password-input.component';

// Verification Code Input Component
export * from './lib/verification-code-input/verification-code-input.component';

// Email Input Component
export * from './lib/email-input/email-input.component';

// Hero Component
export * from './lib/hero/hero.component';

// Progress Bar Component
export * from './lib/progress-bar/progress-bar.component';

// Divider Component
export * from './lib/divider/divider.component';

// Search Input Component
export * from './lib/search-input/search-input.component';

// File Upload Component
export * from './lib/file-upload/file-upload.component';

// Popover Component
export * from './lib/popover/popover.component';

// ============================================================================
// Layout Components
// ============================================================================
// Container Component
export * from './lib/container/container.component';

// Page Header Component
export * from './lib/page-header/page-header.component';

// Page Layout Component
export * from './lib/page-layout/page-layout.component';

// Section Component
export * from './lib/section/section.component';

// Spacer Component
export * from './lib/spacer/spacer.component';

// Stack Component
export * from './lib/stack/stack.component';

// Toolbar Component
export * from './lib/toolbar/toolbar.component';

// ============================================================================
// Feedback Components
// ============================================================================
// Alert Component
export * from './lib/alert/alert.component';

// Error Display Component
export * from './lib/error-display/error-display.component';

// Toast Service and Component
export * from './lib/toast/toast.service';
export * from './lib/toast/toast.component';

// Modal Component
export * from './lib/modal/modal.component';

// Tooltip Directive
export * from './lib/tooltip/tooltip.directive';

// ============================================================================
// Navigation Components
// ============================================================================
// Breadcrumbs Component
export * from './lib/breadcrumbs/breadcrumbs.component';

// Header Component
export * from './lib/header/header.component';

// Pagination Component
export * from './lib/pagination/pagination.component';

// Sidenav Component
export * from './lib/sidenav/sidenav.component';

// Tabs Component
export * from './lib/tabs/tabs.component';

// ============================================================================
// Data Display Components
// ============================================================================
// Avatar Component
export * from './lib/avatar/avatar.component';

// Badge Component
export * from './lib/badge/badge.component';

// ToggleGroup Component
export * from './lib/toggle-group/toggle-group.component';

// List Component
export * from './lib/list/list.component';
export * from './lib/list/list-item-template.directive';

// Chip Component
export * from './lib/chip/chip.component';

// Table Component
export * from './lib/table/table.component';
export * from './lib/table/table-cell.directive';

// Field Group Component
export * from './lib/field-group/field-group.component';

// Stepper Component
export * from './lib/stepper/stepper.component';

// FilterBar Component
export * from './lib/filter-bar/filter-bar.component';

// Spinner Component
export * from './lib/spinner/spinner.component';

// Skeleton Component
export * from './lib/skeleton/skeleton.component';

// Empty State Component
export * from './lib/empty-state/empty-state.component';

// Drawer Component
export * from './lib/drawer/drawer.component';

// Timeline Component
export * from './lib/timeline/timeline.component';

// Avatar Group Component
export * from './lib/avatar-group/avatar-group.component';

// Slider Component
export * from './lib/slider/slider.component';

// Number Input Component
export * from './lib/number-input/number-input.component';

// Callout Component
export * from './lib/callout/callout.component';

// Rating Component
export * from './lib/rating/rating.component';

// Color Picker Component
export * from './lib/color-picker/color-picker.component';

// Code Block Component
export * from './lib/code-block/code-block.component';

// Footer Component
export * from './lib/footer/footer.component';

// ============================================================================
// Chart Components
// ============================================================================
// Sparkline Component
export * from './lib/sparkline/sparkline.component';

// Stat Trend Component
export * from './lib/stat-trend/stat-trend.component';

// Donut Chart Component
export * from './lib/donut-chart/donut-chart.component';

// Bar Chart Component
export * from './lib/bar-chart/bar-chart.component';

// Line Chart Component
export * from './lib/line-chart/line-chart.component';

// Gauge Component
export * from './lib/gauge/gauge.component';

// Stacked Bar Chart Component
export * from './lib/stacked-bar-chart/stacked-bar-chart.component';

// Area Chart Component
export * from './lib/area-chart/area-chart.component';

// Heatmap Component
export * from './lib/heatmap/heatmap.component';

// Pie Chart Component
export * from './lib/pie-chart/pie-chart.component';

// Radar Chart Component
export * from './lib/radar-chart/radar-chart.component';

// Progress Ring Component
export * from './lib/progress-ring/progress-ring.component';

// Waterfall Chart Component
export * from './lib/waterfall-chart/waterfall-chart.component';

// ============================================================================
// Complex Components
// ============================================================================
// Calendar Component
export * from './lib/calendar/calendar.component';

// Gantt Chart Component
export * from './lib/gantt-chart/gantt-chart.component';

// Chat Component
export * from './lib/chat/chat.component';

// Document Viewer Component
export * from './lib/document-viewer/document-viewer.component';

// Gallery Component
export * from './lib/gallery/gallery.component';

// Dependency Viewer Component
export * from './lib/dependency-viewer/dependency-viewer.component';

// Tree View Component
export * from './lib/tree-view/tree-view.component';
export * from './lib/tree-view/file-icons';

// Scatter Plot Component
export * from './lib/scatter-plot/scatter-plot.component';

// Funnel Chart Component
export * from './lib/funnel-chart/funnel-chart.component';

// Tag Input Component
export * from './lib/tag-input/tag-input.component';

// Date Range Picker Component
export * from './lib/date-range-picker/date-range-picker.component';

// Diff Viewer Component
export * from './lib/diff-viewer/diff-viewer.component';

// Kanban Board Component
export * from './lib/kanban-board/kanban-board.component';

// Notification Center Component
export * from './lib/notification-center/notification-center.component';

// Rich Text Editor Component
export * from './lib/rich-text-editor/rich-text-editor.component';

// Markdown Component
export * from './lib/markdown/markdown.component';

// Log Viewer Component
export * from './lib/log-viewer/log-viewer.component';

// Confirm Dialog Component & Service
export * from './lib/confirm-dialog/confirm-dialog.component';
export * from './lib/confirm-dialog/confirm.service';

// Combobox Component
export * from './lib/combobox/combobox.component';

// Stage List Component
export * from './lib/stage-list/stage-list.component';

// ============================================================================
// Styles
// ============================================================================
// Styles are available at: libs/shared/src/styles/index.scss
// Import path: '@life-cockpit/angular-ui-kit/styles/index.scss'
