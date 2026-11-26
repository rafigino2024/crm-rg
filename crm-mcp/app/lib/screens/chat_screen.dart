import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../models/models.dart';
import '../providers.dart';

const _suggestions = [
  'מה המשימות שלי להיום?',
  'תן לי סיכום של הפייפליין',
  'אילו לידים נמצאים בשלב הצעת מחיר?',
  'צור ליד חדש: רונית אברהם מחברת דלתא',
];

/// Chat with Claude, which works on the CRM through the MCP tools.
class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _send([String? text]) async {
    final msg = (text ?? _input.text).trim();
    if (msg.isEmpty) return;
    _input.clear();
    _scrollToEnd();
    final changed = await ref.read(chatProvider.notifier).send(msg);
    if (changed) refreshAll(ref); // the AI changed leads/tasks: refresh the other tabs
    _scrollToEnd();
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final chat = ref.watch(chatProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('עוזר AI'),
        actions: [
          if (chat.messages.isNotEmpty)
            IconButton(
              tooltip: 'שיחה חדשה',
              icon: const Icon(Icons.refresh),
              onPressed: chat.sending ? null : () => ref.read(chatProvider.notifier).clear(),
            ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: chat.messages.isEmpty
                ? _EmptyState(onPick: _send)
                : ListView.builder(
                    controller: _scroll,
                    padding: const EdgeInsets.all(12),
                    itemCount: chat.messages.length + (chat.sending ? 1 : 0),
                    itemBuilder: (context, i) =>
                        i == chat.messages.length ? const _TypingBubble() : _Bubble(chat.messages[i]),
                  ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(8, 4, 8, 8),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _input,
                      minLines: 1,
                      maxLines: 4,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _send(),
                      decoration: const InputDecoration(
                        hintText: 'בקש משהו מהעוזר...',
                        border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(24))),
                        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    tooltip: 'שליחה',
                    onPressed: chat.sending ? null : _send,
                    // In RTL the "send" arrow should point left.
                    icon: const Icon(Icons.send, textDirection: TextDirection.rtl),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onPick});
  final void Function(String) onPick;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const SizedBox(height: 24),
        Icon(Icons.auto_awesome, size: 48, color: Theme.of(context).colorScheme.primary),
        const SizedBox(height: 12),
        Text(
          'שלום! אני יכול לחפש, לעדכן וליצור לידים ומשימות בשבילך.',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 24),
        Wrap(
          alignment: WrapAlignment.center,
          spacing: 8,
          runSpacing: 8,
          children: [for (final s in _suggestions) ActionChip(label: Text(s), onPressed: () => onPick(s))],
        ),
      ],
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble(this.msg);
  final ChatMessage msg;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final bg = msg.isError
        ? scheme.errorContainer
        : msg.fromUser
        ? scheme.primaryContainer
        : scheme.surfaceContainerHighest;
    return Align(
      // RTL: start = right. User messages on the right, assistant on the left.
      alignment: msg.fromUser ? AlignmentDirectional.centerStart : AlignmentDirectional.centerEnd,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.8),
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 4),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(16)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (msg.isError)
                Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Icon(Icons.error_outline, size: 18, color: scheme.onErrorContainer),
                ),
              SelectableText(msg.text),
              if (msg.actions.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 4,
                  runSpacing: 4,
                  children: [
                    for (final a in msg.actions)
                      Chip(
                        visualDensity: VisualDensity.compact,
                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        avatar: Icon(
                          a.isError ? Icons.error_outline : Icons.auto_awesome,
                          size: 14,
                          color: a.isError ? scheme.error : Colors.purple,
                        ),
                        label: Text(a.label, style: const TextStyle(fontSize: 11)),
                      ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _TypingBubble extends StatelessWidget {
  const _TypingBubble();

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: AlignmentDirectional.centerEnd,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)),
            SizedBox(width: 8),
            Text('העוזר עובד על זה...'),
          ],
        ),
      ),
    );
  }
}
