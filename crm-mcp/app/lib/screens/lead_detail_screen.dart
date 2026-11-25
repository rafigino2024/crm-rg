import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart' show DateFormat;
import 'package:material_ui/material_ui.dart';

import '../models/models.dart';
import '../providers.dart';
import '../widgets/common.dart';
import 'lead_form_screen.dart';
import 'tasks_screen.dart';

class LeadDetailScreen extends ConsumerWidget {
  const LeadDetailScreen({super.key, required this.leadId});
  final int leadId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lead = ref.watch(leadProvider(leadId));
    return Scaffold(
      appBar: AppBar(
        title: Text(lead.value?.name ?? ''),
        actions: [
          if (lead.hasValue)
            IconButton(
              tooltip: 'עריכה',
              icon: const Icon(Icons.edit),
              onPressed: () async {
                final saved = await Navigator.push<Lead>(
                  context,
                  MaterialPageRoute(builder: (_) => LeadFormScreen(lead: lead.value)),
                );
                if (saved != null) refreshAll(ref);
              },
            ),
          IconButton(tooltip: 'מחיקה', icon: const Icon(Icons.delete_outline), onPressed: () => _delete(context, ref)),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        heroTag: 'fab-lead-task',
        tooltip: 'משימה חדשה',
        onPressed: () => showAddTaskDialog(context, ref, leadId: leadId),
        child: const Icon(Icons.add_task),
      ),
      body: AsyncView(
        value: lead,
        onRetry: () => ref.invalidate(leadProvider(leadId)),
        builder: (l) => RefreshIndicator(
          onRefresh: () async => refreshAll(ref),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
            children: [
              _Header(lead: l),
              const SizedBox(height: 16),
              _section(context, 'משימות'),
              _LeadTasks(leadId: leadId),
              const SizedBox(height: 16),
              _section(context, 'היסטוריה'),
              _LeadActivities(leadId: leadId),
            ],
          ),
        ),
      ),
    );
  }

  Widget _section(BuildContext context, String title) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(title, style: Theme.of(context).textTheme.titleMedium),
  );

  Future<void> _delete(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('למחוק את הליד?'),
        content: const Text('הליד, המשימות וההיסטוריה שלו יימחקו לצמיתות.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('ביטול')),
          FilledButton(onPressed: () => Navigator.pop(c, true), child: const Text('מחיקה')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(apiProvider).deleteLead(leadId);
      if (context.mounted) Navigator.pop(context);
    } catch (e) {
      if (context.mounted) showError(context, e);
    }
  }
}

class _Header extends ConsumerWidget {
  const _Header({required this.lead});
  final Lead lead;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Widget row(IconData icon, String? text, {bool ltr = false}) => text == null || text.isEmpty
        ? const SizedBox.shrink()
        : Padding(
            padding: const EdgeInsets.symmetric(vertical: 3),
            child: Row(
              children: [
                Icon(icon, size: 18),
                const SizedBox(width: 8),
                Flexible(child: Text(text, textDirection: ltr ? TextDirection.ltr : null)),
              ],
            ),
          );

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            row(Icons.business, lead.company),
            row(Icons.email_outlined, lead.email, ltr: true),
            row(Icons.phone_outlined, lead.phone, ltr: true),
            row(Icons.payments_outlined, lead.estimatedValue == null ? null : formatMoney(lead.estimatedValue!)),
            row(Icons.flag_outlined, 'עדיפות ${lead.priority.label}'),
            row(Icons.event, lead.followUpDate == null ? null : 'מעקב: ${formatDate(lead.followUpDate)}'),
            if (lead.notes != null && lead.notes!.isNotEmpty) ...[const Divider(), Text(lead.notes!)],
            const Divider(),
            Text('שלב', style: Theme.of(context).textTheme.labelMedium),
            const SizedBox(height: 6),
            // Quick stage change without opening the edit form.
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                for (final s in Stage.values)
                  ChoiceChip(
                    label: Text(s.label),
                    selected: s == lead.stage,
                    selectedColor: stageColor(s).withValues(alpha: 0.25),
                    onSelected: (_) async {
                      if (s == lead.stage) return;
                      try {
                        await ref.read(apiProvider).updateLead(lead.id, {'stage': s.api});
                        refreshAll(ref);
                      } catch (e) {
                        if (context.mounted) showError(context, e);
                      }
                    },
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _LeadTasks extends ConsumerWidget {
  const _LeadTasks({required this.leadId});
  final int leadId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasks = ref.watch(leadTasksProvider(leadId));
    return AsyncView(
      value: tasks,
      onRetry: () => ref.invalidate(leadTasksProvider(leadId)),
      builder: (list) =>
          list.isEmpty ? const Text('אין משימות') : Column(children: [for (final t in list) TaskTile(task: t)]),
    );
  }
}

class _LeadActivities extends ConsumerWidget {
  const _LeadActivities({required this.leadId});
  final int leadId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final acts = ref.watch(leadActivitiesProvider(leadId));
    final fmt = DateFormat('d.M.yyyy HH:mm');
    return AsyncView(
      value: acts,
      onRetry: () => ref.invalidate(leadActivitiesProvider(leadId)),
      builder: (list) => Column(
        children: [
          for (final a in list)
            ListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
              leading: a.byAi
                  ? const Tooltip(
                      message: 'בוצע על ידי AI',
                      child: Icon(Icons.auto_awesome, color: Colors.purple),
                    )
                  : const Icon(Icons.person_outline),
              title: Text(a.label),
              subtitle: a.createdAt == null ? null : Text(fmt.format(a.createdAt!.toLocal())),
            ),
        ],
      ),
    );
  }
}
