import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../models/models.dart';
import '../providers.dart';
import '../widgets/common.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(summaryProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('דשבורד')),
      body: AsyncView(
        value: summary,
        onRetry: () => ref.invalidate(summaryProvider),
        builder: (s) => RefreshIndicator(
          onRefresh: () => ref.refresh(summaryProvider.future),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  _Kpi(label: 'לידים', value: '${s.totalLeads}', icon: Icons.people),
                  _Kpi(label: 'שווי פתוח', value: formatMoney(s.openPipelineValue), icon: Icons.trending_up),
                ],
              ),
              Row(
                children: [
                  _Kpi(
                    label: 'משימות באיחור',
                    value: '${s.overdueTasks}',
                    icon: Icons.warning_amber,
                    alert: s.overdueTasks > 0,
                  ),
                  _Kpi(label: 'מעקבים להיום', value: '${s.followUpsDue}', icon: Icons.event, alert: s.followUpsDue > 0),
                ],
              ),
              const SizedBox(height: 16),
              Text('פייפליין', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              ...Stage.values.map((stage) {
                final stat = s.byStage.where((b) => b.stage == stage).firstOrNull;
                final count = stat?.count ?? 0;
                final max = s.byStage.fold<int>(1, (m, b) => b.count > m ? b.count : m);
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    children: [
                      SizedBox(width: 90, child: Text(stage.label)),
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: count / max,
                            minHeight: 14,
                            color: stageColor(stage),
                            backgroundColor: stageColor(stage).withValues(alpha: 0.1),
                          ),
                        ),
                      ),
                      SizedBox(width: 32, child: Text('$count', textAlign: TextAlign.end)),
                    ],
                  ),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }
}

class _Kpi extends StatelessWidget {
  const _Kpi({required this.label, required this.value, required this.icon, this.alert = false});
  final String label;
  final String value;
  final IconData icon;
  final bool alert;

  @override
  Widget build(BuildContext context) {
    final color = alert ? Theme.of(context).colorScheme.error : Theme.of(context).colorScheme.primary;
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: color),
              const SizedBox(height: 8),
              Text(value, style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: color)),
              Text(label, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ),
    );
  }
}
