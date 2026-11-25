import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../models/models.dart';
import '../providers.dart';
import '../widgets/common.dart';

/// Create a lead (lead == null) or edit an existing one. Pops with the saved Lead.
class LeadFormScreen extends ConsumerStatefulWidget {
  const LeadFormScreen({super.key, this.lead});
  final Lead? lead;

  @override
  ConsumerState<LeadFormScreen> createState() => _LeadFormScreenState();
}

class _LeadFormScreenState extends ConsumerState<LeadFormScreen> {
  final _form = GlobalKey<FormState>();
  late final _name = TextEditingController(text: widget.lead?.name);
  late final _company = TextEditingController(text: widget.lead?.company);
  late final _email = TextEditingController(text: widget.lead?.email);
  late final _phone = TextEditingController(text: widget.lead?.phone);
  late final _value = TextEditingController(text: widget.lead?.estimatedValue?.toStringAsFixed(0));
  late final _notes = TextEditingController(text: widget.lead?.notes);
  late Stage _stage = widget.lead?.stage ?? Stage.newLead;
  late Priority _priority = widget.lead?.priority ?? Priority.medium;
  late String? _followUp = widget.lead?.followUpDate;
  bool _saving = false;

  @override
  void dispose() {
    for (final c in [_name, _company, _email, _phone, _value, _notes]) {
      c.dispose();
    }
    super.dispose();
  }

  String? _opt(TextEditingController c) => c.text.trim().isEmpty ? null : c.text.trim();

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _saving = true);
    final fields = <String, dynamic>{
      'name': _name.text.trim(),
      'stage': _stage.api,
      'priority': _priority.api,
      if (_opt(_company) != null) 'company': _opt(_company),
      if (_opt(_email) != null) 'email': _opt(_email),
      if (_opt(_phone) != null) 'phone': _opt(_phone),
      if (_opt(_value) != null) 'estimated_value': double.parse(_opt(_value)!),
      if (_opt(_notes) != null) 'notes': _opt(_notes),
      if (_followUp != null) 'follow_up_date': _followUp,
    };
    try {
      final api = ref.read(apiProvider);
      final saved = widget.lead == null ? await api.createLead(fields) : await api.updateLead(widget.lead!.id, fields);
      if (mounted) Navigator.pop(context, saved);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    const gap = SizedBox(height: 12);
    return Scaffold(
      appBar: AppBar(title: Text(widget.lead == null ? 'ליד חדש' : 'עריכת ליד')),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _name,
              decoration: const InputDecoration(labelText: 'שם *', border: OutlineInputBorder()),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'שדה חובה' : null,
            ),
            gap,
            TextFormField(
              controller: _company,
              decoration: const InputDecoration(labelText: 'חברה', border: OutlineInputBorder()),
            ),
            gap,
            TextFormField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              textDirection: TextDirection.ltr,
              decoration: const InputDecoration(labelText: 'אימייל', border: OutlineInputBorder()),
              validator: (v) => (v != null && v.trim().isNotEmpty && !RegExp(r'^\S+@\S+\.\S+$').hasMatch(v.trim()))
                  ? 'אימייל לא תקין'
                  : null,
            ),
            gap,
            TextFormField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              textDirection: TextDirection.ltr,
              decoration: const InputDecoration(labelText: 'טלפון', border: OutlineInputBorder()),
            ),
            gap,
            TextFormField(
              controller: _value,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'שווי עסקה משוער (₪)', border: OutlineInputBorder()),
              validator: (v) =>
                  (v != null && v.trim().isNotEmpty && double.tryParse(v.trim()) == null) ? 'יש להזין מספר' : null,
            ),
            gap,
            DropdownButtonFormField<Stage>(
              initialValue: _stage,
              decoration: const InputDecoration(labelText: 'שלב', border: OutlineInputBorder()),
              items: [for (final s in Stage.values) DropdownMenuItem(value: s, child: Text(s.label))],
              onChanged: (v) => setState(() => _stage = v!),
            ),
            gap,
            SegmentedButton<Priority>(
              segments: [for (final p in Priority.values) ButtonSegment(value: p, label: Text(p.label))],
              selected: {_priority},
              onSelectionChanged: (s) => setState(() => _priority = s.first),
            ),
            gap,
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.event),
              title: Text(_followUp == null ? 'אין תאריך מעקב' : 'מעקב: ${formatDate(_followUp)}'),
              trailing: _followUp == null
                  ? null
                  : IconButton(icon: const Icon(Icons.clear), onPressed: () => setState(() => _followUp = null)),
              onTap: () async {
                final d = await showDatePicker(
                  context: context,
                  initialDate: DateTime.tryParse(_followUp ?? '') ?? DateTime.now(),
                  firstDate: DateTime(2020),
                  lastDate: DateTime(2100),
                );
                if (d != null) setState(() => _followUp = toIsoDate(d));
              },
            ),
            gap,
            TextFormField(
              controller: _notes,
              maxLines: 4,
              decoration: const InputDecoration(labelText: 'הערות', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _saving ? null : _save,
              child: _saving
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('שמירה'),
            ),
          ],
        ),
      ),
    );
  }
}
