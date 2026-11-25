import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../models/models.dart';
import '../providers.dart';
import '../widgets/common.dart';
import 'lead_detail_screen.dart';
import 'lead_form_screen.dart';

class LeadsScreen extends ConsumerWidget {
  const LeadsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leads = ref.watch(leadsProvider);
    final stageFilter = ref.watch(leadStageFilterProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('לידים')),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'fab-leads',
        onPressed: () async {
          final created = await Navigator.push<Lead>(
            context,
            MaterialPageRoute(builder: (_) => const LeadFormScreen()),
          );
          if (created != null) refreshAll(ref);
        },
        icon: const Icon(Icons.person_add),
        label: const Text('ליד חדש'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'חיפוש לפי שם, חברה או אימייל',
                prefixIcon: Icon(Icons.search),
                isDense: true,
                border: OutlineInputBorder(),
              ),
              onSubmitted: (v) => ref.read(leadSearchProvider.notifier).set(v.trim()),
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: Row(
              children: [
                _filterChip(ref, null, 'הכל', stageFilter),
                for (final s in Stage.values) _filterChip(ref, s, s.label, stageFilter),
              ],
            ),
          ),

          Expanded(
            child: AsyncView(
              value: leads,
              onRetry: () => ref.invalidate(leadsProvider),
              builder: (list) => RefreshIndicator(
                onRefresh: () => ref.refresh(leadsProvider.future),
                child: list.isEmpty
                    ? ListView(
                        children: const [
                          SizedBox(height: 120),
                          Center(child: Text('אין לידים להצגה')),
                        ],
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.only(bottom: 88),
                        itemCount: list.length,
                        separatorBuilder: (_, _) => const Divider(height: 1),
                        itemBuilder: (context, i) => _LeadTile(list[i]),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _filterChip(WidgetRef ref, Stage? value, String label, Stage? current) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 4),
    child: ChoiceChip(
      label: Text(label),
      selected: current == value,
      onSelected: (_) => ref.read(leadStageFilterProvider.notifier).set(value),
    ),
  );
}

class _LeadTile extends ConsumerWidget {
  const _LeadTile(this.lead);
  final Lead lead;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subtitle = [
      lead.company,
      if (lead.estimatedValue != null) formatMoney(lead.estimatedValue!),
    ].whereType<String>().join(' · ');
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: stageColor(lead.stage).withValues(alpha: 0.15),
        child: Text(lead.name.characters.first, style: TextStyle(color: stageColor(lead.stage))),
      ),
      title: Row(
        children: [
          Flexible(child: Text(lead.name, overflow: TextOverflow.ellipsis)),
          if (lead.priority == Priority.high) ...[
            const SizedBox(width: 6),
            const Icon(Icons.local_fire_department, size: 16, color: Colors.deepOrange),
          ],
        ],
      ),
      subtitle: subtitle.isEmpty ? null : Text(subtitle),
      trailing: StageChip(lead.stage),
      onTap: () async {
        await Navigator.push(context, MaterialPageRoute(builder: (_) => LeadDetailScreen(leadId: lead.id)));
        refreshAll(ref);
      },
    );
  }
}
