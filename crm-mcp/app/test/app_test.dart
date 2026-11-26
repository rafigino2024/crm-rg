import 'dart:convert';

import 'package:crm_app/api/crm_api.dart';
import 'package:crm_app/main.dart';
import 'package:crm_app/models/models.dart';
import 'package:crm_app/providers.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:material_ui/material_ui.dart';

final _leads = [
  {
    'id': 1,
    'name': 'דנה כהן',
    'company': 'אלפא',
    'email': null,
    'phone': null,
    'stage': 'Qualified',
    'priority': 'High',
    'source': null,
    'estimated_value': 45000,
    'notes': null,
    'follow_up_date': '2026-11-25',
    'created_at': '2026-11-01T10:00:00.000Z',
    'updated_at': '2026-11-01T10:00:00.000Z',
  },
  {
    'id': 2,
    'name': 'Maya Green',
    'company': 'Gamma',
    'email': null,
    'phone': null,
    'stage': 'Proposal',
    'priority': 'Medium',
    'source': null,
    'estimated_value': null,
    'notes': null,
    'follow_up_date': null,
    'created_at': '2026-11-01T10:00:00.000Z',
    'updated_at': '2026-11-01T10:00:00.000Z',
  },
];

/// Minimal in-memory stand-in for the REST API.
MockClient fakeServer(List<http.Request> log) => MockClient((req) async {
  log.add(req);
  final path = req.url.path;
  Object? body;
  if (path == '/api/summary') {
    body = {
      'by_stage': [
        {'stage': 'Qualified', 'count': 1, 'value': 45000},
        {'stage': 'Proposal', 'count': 1, 'value': 0},
      ],
      'total_leads': 2,
      'open_pipeline_value': 45000,
      'overdue_tasks': 1,
      'follow_ups_due': 1,
    };
  } else if (path == '/api/leads' && req.method == 'GET') {
    final stage = req.url.queryParameters['stage'];
    body = _leads.where((l) => stage == null || l['stage'] == stage).toList();
  } else if (path == '/api/leads' && req.method == 'POST') {
    body = {..._leads[1], 'id': 3, ...jsonDecode(req.body) as Map};
  } else if (path == '/api/chat') {
    final msgs = (jsonDecode(req.body) as Map)['messages'] as List;
    if ((msgs.last as Map)['content'] == 'fail') {
      return http.Response.bytes(utf8.encode('{"error":"עוזר ה-AI לא מוגדר בשרת"}'), 503);
    }
    body = {
      'reply': 'העברתי את Maya Green לשלב נסגר.',
      'actions': [
        {'tool': 'search_leads', 'input': {}, 'is_error': false},
        {'tool': 'update_lead', 'input': {}, 'is_error': false},
      ],
      'changed_data': true,
    };
  } else if (path == '/api/tasks') {
    body = [];
  } else {
    return http.Response('{"error":"not found"}', 404);
  }
  return http.Response.bytes(utf8.encode(jsonEncode(body)), 200, headers: {'content-type': 'application/json'});
});

Widget appWith(MockClient client) => ProviderScope(
  overrides: [apiProvider.overrideWithValue(CrmApi(baseUrl: 'http://test', token: 't', client: client))],
  child: const CrmApp(),
);

void main() {
  setUpAll(() => initializeDateFormatting('he_IL'));

  test('models parse server JSON', () {
    final lead = Lead.fromJson(_leads.first);
    expect(lead.stage, Stage.qualified);
    expect(lead.priority, Priority.high);
    expect(lead.estimatedValue, 45000);
    final act = Activity.fromJson({'id': 1, 'type': 'note', 'description': 'x', 'actor': 'ai'});
    expect(act.byAi, isTrue);
    final stage = Activity.fromJson({
      'id': 2,
      'type': 'stage_changed',
      'description': 'Stage changed',
      'actor': 'user',
      'old_value': 'New',
      'new_value': 'Won',
    });
    expect(stage.label, 'שלב שונה: חדש ← נסגר');
    final overdue = CrmTask.fromJson({'id': 1, 'title': 't', 'status': 'Open', 'due_date': '2000-01-01'});
    expect(overdue.isOverdue, isTrue);
  });

  test('api sends auth header and query filters', () async {
    final log = <http.Request>[];
    final api = CrmApi(baseUrl: 'http://test', token: 'secret', client: fakeServer(log));
    final leads = await api.listLeads(stage: Stage.proposal);
    expect(leads.single.name, 'Maya Green');
    expect(log.single.headers['authorization'], 'Bearer secret');
    expect(log.single.url.queryParameters, {'stage': 'Proposal'});
    expect(() => api.getLead(99), throwsA(isA<ApiException>()));
  });

  testWidgets('dashboard shows KPIs, leads tab lists and filters leads', (tester) async {
    final log = <http.Request>[];
    await tester.pumpWidget(appWith(fakeServer(log)));
    await tester.pumpAndSettle();

    // Dashboard (RTL, Hebrew)
    expect(Directionality.of(tester.element(find.text('דשבורד').first)), TextDirection.rtl);
    expect(find.text('משימות באיחור'), findsOneWidget);
    expect(find.text('2'), findsWidgets);

    // Leads tab
    await tester.tap(find.text('לידים').last);
    await tester.pumpAndSettle();
    expect(find.text('דנה כהן'), findsOneWidget);
    expect(find.text('Maya Green'), findsOneWidget);

    // Filter by stage
    await tester.tap(find.widgetWithText(ChoiceChip, 'הצעת מחיר'));
    await tester.pumpAndSettle();
    expect(find.text('דנה כהן'), findsNothing);
    expect(find.text('Maya Green'), findsOneWidget);
  });

  testWidgets('create lead form validates and posts', (tester) async {
    tester.view.physicalSize = const Size(800, 1600);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final log = <http.Request>[];
    await tester.pumpWidget(appWith(fakeServer(log)));
    await tester.pumpAndSettle();
    await tester.tap(find.text('לידים').last);
    await tester.pumpAndSettle();

    await tester.tap(find.text('ליד חדש'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('שמירה'));
    await tester.pumpAndSettle();
    expect(find.text('שדה חובה'), findsOneWidget);

    await tester.enterText(find.widgetWithText(TextFormField, 'שם *'), 'ליד בדיקה');
    await tester.tap(find.text('שמירה'));
    await tester.pumpAndSettle();

    final post = log.where((r) => r.method == 'POST').single;
    expect(jsonDecode(post.body)['name'], 'ליד בדיקה');
    expect(find.text('ליד חדש'), findsOneWidget); // back on the list (FAB label)
  });

  testWidgets('chat: sends conversation, shows reply and actions, refreshes data', (tester) async {
    final log = <http.Request>[];
    await tester.pumpWidget(appWith(fakeServer(log)));
    await tester.pumpAndSettle();
    await tester.tap(find.text('עוזר AI').last);
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).last, 'תסגור את מאיה');
    await tester.tap(find.byTooltip('שליחה'));
    await tester.pumpAndSettle();

    expect(find.text('תסגור את מאיה'), findsOneWidget);
    expect(find.text('העברתי את Maya Green לשלב נסגר.'), findsOneWidget);
    expect(find.text('עדכון ליד'), findsOneWidget);

    final chatReq = log.singleWhere((r) => r.url.path == '/api/chat');
    expect(jsonDecode(chatReq.body), {
      'messages': [
        {'role': 'user', 'content': 'תסגור את מאיה'},
      ],
    });
    // changed_data=true -> the dashboard summary is fetched again
    expect(log.where((r) => r.url.path == '/api/summary').length, greaterThan(1));

    // Server error shows an error bubble; the next request carries the full text history only.
    await tester.enterText(find.byType(TextField).last, 'fail');
    await tester.tap(find.byTooltip('שליחה'));
    await tester.pumpAndSettle();
    expect(find.textContaining('לא מוגדר'), findsOneWidget);
    final second = jsonDecode(log.where((r) => r.url.path == '/api/chat').last.body)['messages'] as List;
    expect(second.map((m) => m['role']), ['user', 'assistant', 'user']);
  });
}
