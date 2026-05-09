import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const payload = await req.json();

  const { event, data, old_data, changed_fields } = payload;

  if (!data) return Response.json({ ok: true });

  const logs = [];

  if (event.type === 'create') {
    logs.push({
      lead_id: String(data.id),
      type: 'lead_created',
      description: `Lead "${data.name}" was created in stage "${data.stage}"`,
    });
  } else if (event.type === 'update' && old_data) {
    if (changed_fields?.includes('stage')) {
      logs.push({
        lead_id: String(data.id),
        type: 'stage_changed',
        description: `Stage changed from "${old_data.stage}" to "${data.stage}"`,
        old_value: old_data.stage,
        new_value: data.stage,
      });
    }

    if (changed_fields?.includes('notes')) {
      logs.push({
        lead_id: String(data.id),
        type: 'notes_updated',
        description: 'Notes were updated',
        old_value: old_data.notes || '',
        new_value: data.notes || '',
      });
    }

    const trackedFields = ['name', 'company', 'email', 'phone', 'assigned_to', 'follow_up_date'];
    for (const field of trackedFields) {
      if (changed_fields?.includes(field) && old_data[field] !== data[field]) {
        logs.push({
          lead_id: String(data.id),
          type: 'field_updated',
          description: `"${field.replace(/_/g, ' ')}" changed from "${old_data[field] || '(empty)'}" to "${data[field] || '(empty)'}"`,
          old_value: String(old_data[field] || ''),
          new_value: String(data[field] || ''),
        });
      }
    }
  }

  if (logs.length > 0) {
    await Promise.all(logs.map(log => base44.asServiceRole.entities.ActivityLog.create(log)));
  }

  return Response.json({ ok: true, logged: logs.length });
});