import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/models.dart';

class ApiException implements Exception {
  ApiException(this.statusCode, this.message);
  final int statusCode;
  final String message;
  @override
  String toString() => 'שגיאת שרת ($statusCode): $message';
}

/// Thin client for the CRM REST API (/api) served by crm-mcp/server.
class CrmApi {
  CrmApi({required this.baseUrl, this.token = '', http.Client? client}) : _client = client ?? http.Client();

  final String baseUrl;
  final String token;
  final http.Client _client;

  Map<String, String> get _headers => {
    'content-type': 'application/json',
    if (token.isNotEmpty) 'authorization': 'Bearer $token',
  };

  Uri _uri(String path, [Map<String, String?> query = const {}]) {
    final q = {
      for (final e in query.entries)
        if (e.value != null && e.value!.isNotEmpty) e.key: e.value!,
    };
    return Uri.parse('$baseUrl/api$path').replace(queryParameters: q.isEmpty ? null : q);
  }

  dynamic _decode(http.Response r) {
    if (r.statusCode >= 400) {
      String msg = r.body;
      try {
        msg = (jsonDecode(r.body) as Map)['error']?.toString() ?? r.body;
      } catch (_) {}
      throw ApiException(r.statusCode, msg);
    }
    return r.body.isEmpty ? null : jsonDecode(utf8.decode(r.bodyBytes));
  }

  Future<dynamic> _get(String path, [Map<String, String?> q = const {}]) async =>
      _decode(await _client.get(_uri(path, q), headers: _headers));
  Future<dynamic> _send(String method, String path, [Object? body]) async {
    final req = http.Request(method, _uri(path))..headers.addAll(_headers);
    if (body != null) req.body = jsonEncode(body);
    return _decode(await http.Response.fromStream(await _client.send(req)));
  }

  // Leads
  Future<List<Lead>> listLeads({Stage? stage, String? search}) async =>
      (await _get('/leads', {'stage': stage?.api, 'search': search}) as List).map((j) => Lead.fromJson(j)).toList();
  Future<Lead> getLead(int id) async => Lead.fromJson(await _get('/leads/$id'));
  Future<Lead> createLead(Map<String, dynamic> fields) async => Lead.fromJson(await _send('POST', '/leads', fields));
  Future<Lead> updateLead(int id, Map<String, dynamic> fields) async =>
      Lead.fromJson(await _send('PATCH', '/leads/$id', fields));
  Future<void> deleteLead(int id) => _send('DELETE', '/leads/$id');
  Future<List<Activity>> listActivities(int leadId) async =>
      (await _get('/leads/$leadId/activities') as List).map((j) => Activity.fromJson(j)).toList();

  // Tasks
  Future<List<CrmTask>> listTasks({int? leadId, bool? done}) async => (await _get('/tasks', {
    'lead_id': leadId?.toString(),
    'status': done == null ? null : (done ? 'Done' : 'Open'),
  }) as List).map((j) => CrmTask.fromJson(j)).toList();
  Future<CrmTask> createTask({required String title, int? leadId, String? dueDate}) async =>
      CrmTask.fromJson(await _send('POST', '/tasks', {'title': title, 'lead_id': ?leadId, 'due_date': ?dueDate}));
  Future<CrmTask> setTaskDone(int id, bool done) async =>
      CrmTask.fromJson(await _send('PATCH', '/tasks/$id', {'status': done ? 'Done' : 'Open'}));
  Future<void> deleteTask(int id) => _send('DELETE', '/tasks/$id');

  // Dashboard
  Future<PipelineSummary> summary() async => PipelineSummary.fromJson(await _get('/summary'));
}
