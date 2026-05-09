import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Use service role to access all leads
    const today = new Date().toISOString().split('T')[0];

    const leads = await base44.asServiceRole.entities.Lead.list();

    const dueLeads = leads.filter(
      (l) => l.follow_up_date === today && !["Won", "Lost"].includes(l.stage)
    );

    if (dueLeads.length === 0) {
      return Response.json({ message: "No follow-ups due today.", sent: 0 });
    }

    // Get the admin user(s) to notify
    const users = await base44.asServiceRole.entities.User.list();
    const admins = users.filter((u) => u.role === 'admin');

    if (admins.length === 0) {
      return Response.json({ message: "No admin users found.", sent: 0 });
    }

    const leadRows = dueLeads
      .map(
        (l) =>
          `• <strong>${l.name}</strong>${l.company ? ` (${l.company})` : ''} — Stage: ${l.stage}${l.assigned_to ? ` · Assigned to: ${l.assigned_to}` : ''}`
      )
      .join('<br/>');

    const body = `
      <p>Hi,</p>
      <p>You have <strong>${dueLeads.length}</strong> lead${dueLeads.length > 1 ? 's' : ''} with a follow-up due today (${today}):</p>
      <p style="line-height:1.8">${leadRows}</p>
      <p>Open your CRM to take action.</p>
    `;

    let sent = 0;
    for (const admin of admins) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `📋 ${dueLeads.length} Follow-up${dueLeads.length > 1 ? 's' : ''} Due Today`,
        body,
      });
      sent++;
    }

    return Response.json({ message: `Sent ${sent} email(s) for ${dueLeads.length} lead(s).`, sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});