import { Component, OnInit, signal, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Checklist, ChecklistGroup, ChecklistItem } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

type Modal =
  | { kind: 'none' }
  | { kind: 'newChecklist' }
  | { kind: 'editChecklist'; checklist: Checklist }
  | { kind: 'deleteChecklist'; checklist: Checklist };

@Component({
  selector: 'app-checklist-group-detail',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './checklist-group-detail.html',
})
export class ChecklistGroupDetail implements OnInit {
  groupId = 0;
  group = signal<ChecklistGroup | null>(null);
  checklists = signal<Checklist[]>([]);
  loading = signal(true);
  saving = signal(false);
  openCardMenuId = signal<number | null>(null);
  modal = signal<Modal>({ kind: 'none' });

  formClTitle = signal('');
  formClDesc = signal('');
  formClItems = signal<ChecklistItem[]>([]);
  formClItemDraft = signal('');
  formClItemFocused = signal(false);

  @ViewChild('clItemInput') clItemInput?: ElementRef<HTMLInputElement>;

  constructor(private api: ApiService, private toast: ToastService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.groupId = parseInt(this.route.snapshot.paramMap.get('groupId') ?? '0');
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.getChecklistGroups().subscribe({
      next: groups => {
        const g = groups.find(g => g.id === this.groupId) ?? null;
        this.group.set(g);
      }
    });
    this.api.getGroupChecklists(this.groupId).subscribe({
      next: lists => { this.checklists.set(lists); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  progress(cl: Checklist) {
    if (!cl.items.length) return 0;
    return Math.round((cl.items.filter(i => i.checked).length / cl.items.length) * 100);
  }
  checkedCount(cl: Checklist) { return cl.items.filter(i => i.checked).length; }

  closeModal() { this.modal.set({ kind: 'none' }); }

  openNewChecklist() {
    this.formClTitle.set('');
    this.formClDesc.set('');
    this.formClItems.set([]);
    this.formClItemDraft.set('');
    this.modal.set({ kind: 'newChecklist' });
  }

  addDraftItem() {
    const text = this.formClItemDraft().trim();
    if (!text) return;
    const newItem: ChecklistItem = { id: Date.now().toString(), title: text, checked: false, order: this.formClItems().length + 1 };
    this.formClItems.update(items => [...items, newItem]);
    this.formClItemDraft.set('');
    if (this.clItemInput?.nativeElement) {
      this.clItemInput.nativeElement.value = '';
      this.clItemInput.nativeElement.focus();
    }
  }

  removeDraftItem(id: string) {
    this.formClItems.update(items => items.filter(i => i.id !== id).map((item, idx) => ({ ...item, order: idx + 1 })));
  }

  onItemInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') { event.preventDefault(); this.addDraftItem(); }
  }

  submitNewChecklist() {
    if (!this.formClTitle().trim()) { this.toast.show({ title: 'Title required', variant: 'destructive' }); return; }
    const draftText = this.formClItemDraft().trim();
    const finalItems = draftText
      ? [...this.formClItems(), { id: Date.now().toString(), title: draftText, checked: false, order: this.formClItems().length + 1 }]
      : this.formClItems();
    this.saving.set(true);
    this.api.createGroupChecklist(this.groupId, {
      title: this.formClTitle().trim(),
      description: this.formClDesc().trim() || undefined,
      items: finalItems,
    }).subscribe({
      next: cl => {
        this.checklists.update(lists => [...lists, cl]);
        this.toast.show({ title: 'Checklist created' });
        this.saving.set(false);
        this.closeModal();
      },
      error: e => { this.toast.show({ title: 'Failed', description: e.message, variant: 'destructive' }); this.saving.set(false); }
    });
  }

  openEditChecklist(cl: Checklist, event: Event) {
    event.stopPropagation();
    this.formClTitle.set(cl.title);
    this.formClDesc.set(cl.description ?? '');
    this.modal.set({ kind: 'editChecklist', checklist: cl });
    this.openCardMenuId.set(null);
  }

  submitEditChecklist() {
    const m = this.modal();
    if (m.kind !== 'editChecklist') return;
    if (!this.formClTitle().trim()) { this.toast.show({ title: 'Title required', variant: 'destructive' }); return; }
    this.saving.set(true);
    this.api.updateGroupChecklist(this.groupId, m.checklist.id, {
      title: this.formClTitle().trim(),
      description: this.formClDesc().trim() || undefined,
      status: m.checklist.status,
      items: m.checklist.items,
    }).subscribe({
      next: updated => {
        this.checklists.update(lists => lists.map(c => c.id === updated.id ? updated : c));
        this.toast.show({ title: 'Checklist updated' });
        this.saving.set(false);
        this.closeModal();
      },
      error: e => { this.toast.show({ title: 'Failed', description: e.message, variant: 'destructive' }); this.saving.set(false); }
    });
  }

  openDeleteChecklist(cl: Checklist, event: Event) {
    event.stopPropagation();
    this.modal.set({ kind: 'deleteChecklist', checklist: cl });
    this.openCardMenuId.set(null);
  }

  submitDeleteChecklist() {
    const m = this.modal();
    if (m.kind !== 'deleteChecklist') return;
    this.saving.set(true);
    this.api.deleteGroupChecklist(this.groupId, m.checklist.id).subscribe({
      next: () => {
        this.checklists.update(lists => lists.filter(c => c.id !== m.checklist.id));
        this.toast.show({ title: 'Checklist deleted' });
        this.saving.set(false);
        this.closeModal();
      },
      error: e => { this.toast.show({ title: 'Failed', description: e.message, variant: 'destructive' }); this.saving.set(false); }
    });
  }

  toggleCardItem(event: Event, cl: Checklist, itemId: string) {
    event.stopPropagation();
    const updatedItems = cl.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i);
    this.checklists.update(lists => lists.map(c => c.id === cl.id ? { ...c, items: updatedItems } : c));
    this.api.updateGroupChecklist(this.groupId, cl.id, {
      title: cl.title, description: cl.description, status: cl.status, items: updatedItems,
    }).subscribe({
      next: updated => { this.checklists.update(lists => lists.map(c => c.id === updated.id ? updated : c)); },
      error: () => {
        this.checklists.update(lists => lists.map(c => c.id === cl.id ? cl : c));
        this.toast.show({ title: 'Failed to save', variant: 'destructive' });
      }
    });
  }

  toggleCardMenu(id: number, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.openCardMenuId.update(v => v === id ? null : id);
  }

  @HostListener('document:click')
  closeCardMenus() { this.openCardMenuId.set(null); }
}
