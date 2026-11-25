import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'api/crm_api.dart';
import 'config.dart';
import 'models/models.dart';

/// Overridden in tests with a fake HTTP client.
final apiProvider = Provider<CrmApi>((ref) => CrmApi(baseUrl: AppConfig.apiUrl, token: AppConfig.apiToken));

/// A simple settable value (filters, toggles).
class ValueState<T> extends Notifier<T> {
  ValueState(this._initial);
  final T _initial;
  @override
  T build() => _initial;
  void set(T value) => state = value;
}

/// Current filters on the leads screen.
final leadStageFilterProvider = NotifierProvider<ValueState<Stage?>, Stage?>(() => ValueState(null));
final leadSearchProvider = NotifierProvider<ValueState<String>, String>(() => ValueState(''));

final leadsProvider = FutureProvider<List<Lead>>((ref) {
  final stage = ref.watch(leadStageFilterProvider);
  final search = ref.watch(leadSearchProvider);
  return ref.watch(apiProvider).listLeads(stage: stage, search: search);
});

final leadProvider = FutureProvider.family<Lead, int>((ref, id) => ref.watch(apiProvider).getLead(id));
final leadTasksProvider = FutureProvider.family<List<CrmTask>, int>(
  (ref, id) => ref.watch(apiProvider).listTasks(leadId: id),
);
final leadActivitiesProvider = FutureProvider.family<List<Activity>, int>(
  (ref, id) => ref.watch(apiProvider).listActivities(id),
);

final showDoneTasksProvider = NotifierProvider<ValueState<bool>, bool>(() => ValueState(false));
final tasksProvider = FutureProvider<List<CrmTask>>((ref) {
  final showDone = ref.watch(showDoneTasksProvider);
  return ref.watch(apiProvider).listTasks(done: showDone ? null : false);
});

final summaryProvider = FutureProvider<PipelineSummary>((ref) => ref.watch(apiProvider).summary());

/// Call after any write so every screen shows fresh data
/// (including changes the AI made through MCP).
void refreshAll(WidgetRef ref) {
  ref.invalidate(leadsProvider);
  ref.invalidate(leadProvider);
  ref.invalidate(leadTasksProvider);
  ref.invalidate(leadActivitiesProvider);
  ref.invalidate(tasksProvider);
  ref.invalidate(summaryProvider);
}
