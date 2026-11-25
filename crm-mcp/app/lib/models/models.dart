/// Data models mirroring the server's JSON (crm-mcp/server/src/services/types.ts).
library;

enum Stage {
  newLead('New', 'חדש'),
  contacted('Contacted', 'נוצר קשר'),
  qualified('Qualified', 'מתאים'),
  proposal('Proposal', 'הצעת מחיר'),
  won('Won', 'נסגר'),
  lost('Lost', 'אבד');

  const Stage(this.api, this.label);
  final String api;
  final String label;

  static Stage fromApi(String v) => Stage.values.firstWhere((s) => s.api == v, orElse: () => Stage.newLead);
  bool get isClosed => this == won || this == lost;
}

enum Priority {
  low('Low', 'נמוכה'),
  medium('Medium', 'בינונית'),
  high('High', 'גבוהה');

  const Priority(this.api, this.label);
  final String api;
  final String label;

  static Priority fromApi(String v) => Priority.values.firstWhere((p) => p.api == v, orElse: () => Priority.medium);
}

double? _num(dynamic v) => v == null ? null : (v as num).toDouble();

class Lead {
  Lead({
    required this.id,
    required this.name,
    this.company,
    this.email,
    this.phone,
    this.stage = Stage.newLead,
    this.priority = Priority.medium,
    this.source,
    this.estimatedValue,
    this.notes,
    this.followUpDate,
    this.updatedAt,
  });

  final int id;
  final String name;
  final String? company;
  final String? email;
  final String? phone;
  final Stage stage;
  final Priority priority;
  final String? source;
  final double? estimatedValue;
  final String? notes;
  final String? followUpDate;
  final DateTime? updatedAt;

  factory Lead.fromJson(Map<String, dynamic> j) => Lead(
    id: j['id'] as int,
    name: j['name'] as String,
    company: j['company'] as String?,
    email: j['email'] as String?,
    phone: j['phone'] as String?,
    stage: Stage.fromApi(j['stage'] as String? ?? 'New'),
    priority: Priority.fromApi(j['priority'] as String? ?? 'Medium'),
    source: j['source'] as String?,
    estimatedValue: _num(j['estimated_value']),
    notes: j['notes'] as String?,
    followUpDate: j['follow_up_date'] as String?,
    updatedAt: j['updated_at'] == null ? null : DateTime.tryParse(j['updated_at'] as String),
  );
}

class CrmTask {
  CrmTask({required this.id, required this.title, this.leadId, this.done = false, this.dueDate, this.notes});

  final int id;
  final String title;
  final int? leadId;
  final bool done;
  final String? dueDate;
  final String? notes;

  bool get isOverdue {
    if (done || dueDate == null) return false;
    final today = DateTime.now().toIso8601String().substring(0, 10);
    return dueDate!.compareTo(today) < 0;
  }

  factory CrmTask.fromJson(Map<String, dynamic> j) => CrmTask(
    id: j['id'] as int,
    title: j['title'] as String,
    leadId: j['lead_id'] as int?,
    done: j['status'] == 'Done',
    dueDate: j['due_date'] as String?,
    notes: j['notes'] as String?,
  );
}

class Activity {
  Activity({
    required this.id,
    required this.type,
    required this.description,
    required this.byAi,
    this.oldValue,
    this.newValue,
    this.createdAt,
  });

  final int id;
  final String type;

  /// English description from the server (also what AI agents read). Used as a fallback.
  final String description;
  final String? oldValue;
  final String? newValue;

  /// True when the action was performed by an AI agent through MCP.
  final bool byAi;
  final DateTime? createdAt;

  factory Activity.fromJson(Map<String, dynamic> j) => Activity(
    id: j['id'] as int,
    type: j['type'] as String,
    description: j['description'] as String,
    byAi: j['actor'] == 'ai',
    oldValue: j['old_value'] as String?,
    newValue: j['new_value'] as String?,
    createdAt: j['created_at'] == null ? null : DateTime.tryParse(j['created_at'] as String),
  );

  /// Hebrew text for display, built from the structured fields.
  String get label => switch (type) {
    'lead_created' => 'הליד נוצר',
    'stage_changed' when oldValue != null && newValue != null =>
      'שלב שונה: ${Stage.fromApi(oldValue!).label} ← ${Stage.fromApi(newValue!).label}',
    'field_updated' => 'פרטי הליד עודכנו',
    'task_created' when newValue != null => 'נוספה משימה: $newValue',
    'task_completed' when newValue != null => 'משימה הושלמה: $newValue',
    'note' => description,
    _ => description,
  };
}

class StageStat {
  StageStat(this.stage, this.count, this.value);
  final Stage stage;
  final int count;
  final double value;
}

class PipelineSummary {
  PipelineSummary({
    required this.byStage,
    required this.totalLeads,
    required this.openPipelineValue,
    required this.overdueTasks,
    required this.followUpsDue,
  });

  final List<StageStat> byStage;
  final int totalLeads;
  final double openPipelineValue;
  final int overdueTasks;
  final int followUpsDue;

  factory PipelineSummary.fromJson(Map<String, dynamic> j) => PipelineSummary(
    byStage: (j['by_stage'] as List)
        .map((s) => StageStat(Stage.fromApi(s['stage'] as String), s['count'] as int, _num(s['value']) ?? 0))
        .toList(),
    totalLeads: j['total_leads'] as int,
    openPipelineValue: _num(j['open_pipeline_value']) ?? 0,
    overdueTasks: j['overdue_tasks'] as int,
    followUpsDue: j['follow_ups_due'] as int,
  );
}
