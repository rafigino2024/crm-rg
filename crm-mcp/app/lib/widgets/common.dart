import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart' show DateFormat, NumberFormat;
import 'package:material_ui/material_ui.dart';

import '../models/models.dart';

final _money = NumberFormat.currency(locale: 'he_IL', symbol: '₪', decimalDigits: 0);
String formatMoney(double v) => _money.format(v);

String formatDate(String? isoDate) {
  if (isoDate == null) return '';
  final d = DateTime.tryParse(isoDate);
  return d == null ? isoDate : DateFormat('d.M.yyyy').format(d);
}

String toIsoDate(DateTime d) => d.toIso8601String().substring(0, 10);

Color stageColor(Stage s) => switch (s) {
  Stage.newLead => Colors.blueGrey,
  Stage.contacted => Colors.blue,
  Stage.qualified => Colors.teal,
  Stage.proposal => Colors.orange,
  Stage.won => Colors.green,
  Stage.lost => Colors.red,
};

class StageChip extends StatelessWidget {
  const StageChip(this.stage, {super.key});
  final Stage stage;

  @override
  Widget build(BuildContext context) {
    final c = stageColor(stage);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: c.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
      child: Text(
        stage.label,
        style: TextStyle(color: c, fontWeight: FontWeight.w600, fontSize: 12),
      ),
    );
  }
}

/// Renders an AsyncValue with loading spinner and an error + retry state.
class AsyncView<T> extends StatelessWidget {
  const AsyncView({super.key, required this.value, required this.onRetry, required this.builder});

  final AsyncValue<T> value;
  final VoidCallback onRetry;
  final Widget Function(T data) builder;

  @override
  Widget build(BuildContext context) {
    return value.when(
      data: builder,
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.cloud_off, size: 48),
              const SizedBox(height: 12),
              Text('לא ניתן להתחבר לשרת', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 4),
              Text('$e', textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: 12),
              FilledButton.icon(onPressed: onRetry, icon: const Icon(Icons.refresh), label: const Text('נסה שוב')),
            ],
          ),
        ),
      ),
    );
  }
}

void showError(BuildContext context, Object e) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
}
