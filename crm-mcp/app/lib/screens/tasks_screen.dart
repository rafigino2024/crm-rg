import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../models/models.dart';
import '../providers.dart';
import '../widgets/common.dart';
import 'lead_detail_screen.dart';

class TasksScreen extends ConsumerWidget {
  const TasksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasks = ref.watch(tasksProvider);
    final showDone = ref.watch(showDoneTasksProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('משימות'),
        actions: [
          Row(
            children: [
              const Text('כולל בוצעו'),
              Switch(value: showDone, onChanged: (v) => ref.read(showDoneTasksProvider.notifier).set(v)),
            ],
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        heroTag: 'fab-tasks',
        tooltip: 'משימה חדשה',
        onPressed: () => showAddTaskDialog(context, ref),
        child: const Icon(Icons.add),
      ),
      body: AsyncView(
        value: tasks,
        onRetry: () => ref.invalidate(tasksProvider),
        builder: (list) => RefreshIndicator(
          onRefresh: () => ref.refresh(tasksProvider.future),
          child: list.isEmpty
              ? ListView(
                  children: const [
                    SizedBox(height: 120),
                    Center(child: Text('אין משימות פתוחות 🎉')),
                  ],
                )
              : ListView(
                  padding: const EdgeInsets.only(bottom: 88),
                  children: [for (final t in list) TaskTile(task: t, showLeadLink: true)],
                ),
        ),
      ),
    );
  }
}

class TaskTile extends ConsumerWidget {
  const TaskTile({super.key, required this.task, this.showLeadLink = false});
  final CrmTask task;
  final bool showLeadLink;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final overdue = task.isOverdue;
    return CheckboxListTile(
      controlAffinity: ListTileControlAffinity.leading,
      contentPadding: const EdgeInsets.symmetric(horizontal: 8),
      value: task.done,
      title: Text(
        task.title,
        style: task.done ? const TextStyle(decoration: TextDecoration.lineThrough, color: Colors.grey) : null,
      ),
      subtitle: task.dueDate == null
          ? null
          : Text(
              '${overdue ? 'באיחור · ' : ''}${formatDate(task.dueDate)}',
              style: overdue ? TextStyle(color: Theme.of(context).colorScheme.error) : null,
            ),
      secondary: showLeadLink && task.leadId != null
          ? IconButton(
              tooltip: 'פתח ליד',
              icon: const Icon(Icons.person_search),
              onPressed: () async {
                await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => LeadDetailScreen(leadId: task.leadId!)),
                );
                refreshAll(ref);
              },
            )
          : null,
      onChanged: (v) async {
        try {
          await ref.read(apiProvider).setTaskDone(task.id, v ?? false);
          refreshAll(ref);
        } catch (e) {
          if (context.mounted) showError(context, e);
        }
      },
    );
  }
}

Future<void> showAddTaskDialog(BuildContext context, WidgetRef ref, {int? leadId}) async {
  final title = TextEditingController();
  String? due;
  final created = await showDialog<bool>(
    context: context,
    builder: (c) => StatefulBuilder(
      builder: (c, setState) => AlertDialog(
        title: const Text('משימה חדשה'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: title,
              autofocus: true,
              decoration: const InputDecoration(labelText: 'מה צריך לעשות?'),
            ),
            const SizedBox(height: 8),
            TextButton.icon(
              icon: const Icon(Icons.event),
              label: Text(due == null ? 'תאריך יעד' : formatDate(due)),
              onPressed: () async {
                final d = await showDatePicker(
                  context: c,
                  initialDate: DateTime.now(),
                  firstDate: DateTime(2020),
                  lastDate: DateTime(2100),
                );
                if (d != null) setState(() => due = toIsoDate(d));
              },
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('ביטול')),
          FilledButton(
            onPressed: () async {
              if (title.text.trim().isEmpty) return;
              try {
                await ref.read(apiProvider).createTask(title: title.text.trim(), leadId: leadId, dueDate: due);
                if (c.mounted) Navigator.pop(c, true);
              } catch (e) {
                if (c.mounted) showError(c, e);
              }
            },
            child: const Text('הוספה'),
          ),
        ],
      ),
    ),
  );
  title.dispose();
  if (created == true) refreshAll(ref);
}
