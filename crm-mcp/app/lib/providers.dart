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

/// Chat history with the AI assistant (kept while the app is open).
class ChatState {
  const ChatState({this.messages = const [], this.sending = false});
  final List<ChatMessage> messages;
  final bool sending;
}

class ChatNotifier extends Notifier<ChatState> {
  @override
  ChatState build() => const ChatState();

  /// Sends a message. Returns true if the assistant changed CRM data.
  Future<bool> send(String text) async {
    if (state.sending || text.trim().isEmpty) return false;
    final history = [...state.messages, ChatMessage(fromUser: true, text: text.trim())];
    state = ChatState(messages: history, sending: true);
    try {
      final reply = await ref.read(apiProvider).chat(history);
      state = ChatState(
        messages: [
          ...history,
          ChatMessage(fromUser: false, text: reply.reply, actions: reply.actions),
        ],
      );
      return reply.changedData;
    } catch (e) {
      // The error bubble is local only (not sent to the server). The unanswered user
      // message stays in history; two user turns in a row are fine for the API.
      state = ChatState(
        messages: [
          ...history,
          ChatMessage(fromUser: false, text: e is ApiException ? e.message : '$e', isError: true),
        ],
      );
      return false;
    }
  }

  void clear() => state = const ChatState();
}

final chatProvider = NotifierProvider<ChatNotifier, ChatState>(ChatNotifier.new);
