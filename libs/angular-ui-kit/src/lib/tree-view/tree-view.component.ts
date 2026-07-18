import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import {
  FILE_FALLBACK_ICON,
  FOLDER_ICON,
  FOLDER_OPEN_ICON,
  resolveFileIcon,
} from './file-icons';

// ── Public types ─────────────────────────────────────────────────────────────

/**
 * Node type. `'file'` and `'folder'` get the built-in file-tree treatment
 * (extension icons, folder open/close icons). Any other string marks a custom
 * domain type: such nodes render a colored type dot (or an explicit `icon`)
 * instead of file icons.
 */
export type TreeNodeType = 'file' | 'folder' | (string & {});

export type TreeNodeStatus =
  | 'default'
  | 'added'
  | 'modified'
  | 'removed'
  | 'muted'
  | 'success'
  | 'busy';

/**
 * A node in the tree. Any node carrying `children` can expand — this covers
 * file trees (folders) as well as arbitrary domain hierarchies.
 */
export interface TreeNode {
  /** Display name, e.g. `app.component.ts` or `src`. */
  name: string;
  /**
   * Node type. Optional — inferred as `folder` when `children` is present,
   * otherwise `file`. May be any string for domain hierarchies.
   */
  type?: TreeNodeType;
  /**
   * Stable identifier. Optional — when omitted, the full path is used,
   * which is stable as long as names are unique among siblings.
   */
  id?: string;
  /** Child nodes. Any node with children can expand / collapse. */
  children?: TreeNode[];
  /**
   * Explicit Tabler icon name. Overrides automatic file-type / folder
   * icon resolution and the custom-type dot.
   */
  icon?: string;
  /**
   * Accent color for the node's icon / type dot. Any CSS color, including
   * `var(--…)` token references.
   */
  color?: string;
  /** Optional badge text shown to the right of the node (e.g. git status, count). */
  badge?: string;
  /**
   * Tone of the badge / node accent. `success` additionally renders a ✓
   * indicator, `busy` a pulsing dot (static under `prefers-reduced-motion`).
   */
  status?: TreeNodeStatus;
  /** Whether this node starts expanded. Ignored for nodes without children. */
  expanded?: boolean;
  /** Disable selection / interaction for this node. */
  disabled?: boolean;
}

// ── Internal flattened representation ─────────────────────────────────────────

interface FlatNode {
  id: string;
  name: string;
  type: TreeNodeType;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
  /** Resolved icon, or `null` for custom-type nodes that render a type dot. */
  icon: string | null;
  color?: string;
  badge?: string;
  status: TreeNodeStatus;
  disabled: boolean;
  /** Whether each ancestor level still has following siblings (for guide lines). */
  ancestorHasSibling: boolean[];
  /** Whether this node is the last among its siblings. */
  isLast: boolean;
}

const BADGE_STATUS_COLOR: Record<TreeNodeStatus, string> = {
  default: 'var(--color-neutral-400)',
  added: 'var(--color-success-default, #16a34a)',
  modified: 'var(--color-warning-default, #d97706)',
  removed: 'var(--color-error-default, #dc2626)',
  muted: 'var(--color-neutral-300)',
  success: 'var(--color-success-default, #16a34a)',
  busy: 'var(--color-primary-500, #6366f1)',
};

function nodeType(node: TreeNode): TreeNodeType {
  return node.type ?? (node.children ? 'folder' : 'file');
}

function isExpandable(node: TreeNode): boolean {
  return !!node.children?.length;
}

/**
 * Tree view component for visualizing hierarchies — file / folder trees as
 * well as arbitrary domain object trees with custom node types.
 *
 * Features:
 * - Recursive rendering from a single `nodes` input; any node with children
 *   can expand / collapse
 * - Automatic file-type icons by extension and well-known file name,
 *   with open / closed folder icons (for `file` / `folder` nodes)
 * - Custom node types: colored type dots or explicit icons via `type`,
 *   `color`, `icon`
 * - Expand / collapse, with expand-all / collapse-all helpers
 * - Two-way bound selection and a `nodeClick` event
 * - Indentation guide lines for readability
 * - Optional per-node status badges (added / modified / removed) and status
 *   indicators (`success` ✓, `busy` pulse)
 * - Keyboard accessible (Enter / Space to toggle or select)
 * - Dark / light theme support via design tokens
 *
 * @example
 * ```html
 * <lc-tree-view [nodes]="projectTree" [(selectedId)]="selected" />
 * ```
 */
@Component({
  selector: 'lc-tree-view',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'lc-tree-view' },
})
export class TreeViewComponent {
  /** The root-level nodes of the tree. */
  readonly nodes = input.required<TreeNode[]>();

  /** Id (or path) of the currently selected node (two-way bindable). */
  readonly selectedId = model<string | null>(null);

  /** Show indentation guide lines. */
  readonly showGuides = input(true);

  /** Show the expand-all / collapse-all toolbar. */
  readonly showToolbar = input(true);

  /** Icon size for node icons. */
  readonly iconSize = input<'xs' | 'sm' | 'md'>('sm');

  /** Emitted when a node is clicked / activated. */
  readonly nodeClick = output<TreeNode>();

  /** Set of node ids the user has explicitly expanded / collapsed. */
  private readonly expandOverrides = signal<Map<string, boolean>>(new Map());

  /** Flattened, render-ready list of visible nodes. */
  protected readonly visibleNodes = computed<FlatNode[]>(() => {
    const out: FlatNode[] = [];
    const overrides = this.expandOverrides();
    this.flatten(this.nodes(), 0, '', [], overrides, out);
    return out;
  });

  protected badgeColor(status: TreeNodeStatus): string {
    return BADGE_STATUS_COLOR[status];
  }

  protected onNodeClick(flat: FlatNode): void {
    if (flat.disabled) return;
    if (flat.hasChildren) {
      this.toggle(flat);
    }
    this.selectedId.set(flat.id);
    const original = this.findNode(this.nodes(), '', flat.id);
    if (original) this.nodeClick.emit(original);
  }

  protected onToggleClick(flat: FlatNode, event: Event): void {
    event.stopPropagation();
    if (!flat.disabled) this.toggle(flat);
  }

  protected onKeydown(flat: FlatNode, event: KeyboardEvent): void {
    if (flat.disabled) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onNodeClick(flat);
    } else if (event.key === 'ArrowRight' && flat.hasChildren && !flat.expanded) {
      event.preventDefault();
      this.setExpanded(flat.id, true);
    } else if (event.key === 'ArrowLeft' && flat.hasChildren && flat.expanded) {
      event.preventDefault();
      this.setExpanded(flat.id, false);
    }
  }

  /** Expand every folder in the tree. */
  expandAll(): void {
    this.setAll(true);
  }

  /** Collapse every folder in the tree. */
  collapseAll(): void {
    this.setAll(false);
  }

  protected trackById = (_: number, n: FlatNode): string => n.id;

  // ── internals ──────────────────────────────────────────────────────────────

  private toggle(flat: FlatNode): void {
    this.setExpanded(flat.id, !flat.expanded);
  }

  private setExpanded(id: string, value: boolean): void {
    this.expandOverrides.update((map) => {
      const next = new Map(map);
      next.set(id, value);
      return next;
    });
  }

  private setAll(value: boolean): void {
    const next = new Map<string, boolean>();
    const walk = (nodes: TreeNode[], parentPath: string): void => {
      for (const node of nodes) {
        const id = node.id ?? `${parentPath}/${node.name}`;
        if (node.children?.length) {
          next.set(id, value);
          walk(node.children, id);
        }
      }
    };
    walk(this.nodes(), '');
    this.expandOverrides.set(next);
  }

  private isExpanded(
    id: string,
    node: TreeNode,
    overrides: Map<string, boolean>,
  ): boolean {
    const override = overrides.get(id);
    if (override !== undefined) return override;
    return node.expanded ?? false;
  }

  private flatten(
    nodes: TreeNode[],
    depth: number,
    parentPath: string,
    ancestorHasSibling: boolean[],
    overrides: Map<string, boolean>,
    out: FlatNode[],
  ): void {
    nodes.forEach((node, index) => {
      const id = node.id ?? `${parentPath}/${node.name}`;
      const type = nodeType(node);
      const hasChildren = isExpandable(node);
      const expanded = hasChildren && this.isExpanded(id, node, overrides);
      const isLast = index === nodes.length - 1;

      out.push({
        id,
        name: node.name,
        type,
        depth,
        hasChildren,
        expanded,
        icon: this.resolveIcon(node, type, expanded),
        color: node.color,
        badge: node.badge,
        status: node.status ?? 'default',
        disabled: node.disabled ?? false,
        ancestorHasSibling,
        isLast,
      });

      if (expanded && node.children) {
        this.flatten(
          node.children,
          depth + 1,
          id,
          [...ancestorHasSibling, !isLast],
          overrides,
          out,
        );
      }
    });
  }

  private resolveIcon(
    node: TreeNode,
    type: TreeNodeType,
    expanded: boolean,
  ): string | null {
    if (node.icon) return node.icon;
    if (type === 'folder') return expanded ? FOLDER_OPEN_ICON : FOLDER_ICON;
    if (type === 'file') {
      return node.name ? resolveFileIcon(node.name) : FILE_FALLBACK_ICON;
    }
    // Custom domain type without explicit icon: render a colored type dot.
    return null;
  }

  private findNode(
    nodes: TreeNode[],
    parentPath: string,
    targetId: string,
  ): TreeNode | null {
    for (const node of nodes) {
      const id = node.id ?? `${parentPath}/${node.name}`;
      if (id === targetId) return node;
      if (node.children) {
        const found = this.findNode(node.children, id, targetId);
        if (found) return found;
      }
    }
    return null;
  }
}
