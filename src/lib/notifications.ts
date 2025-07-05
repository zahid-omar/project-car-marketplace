import { CreateNotificationRequest, NOTIFICATION_TEMPLATES } from '@/types/messages';

// Helper function to create notifications from templates
export async function createNotificationFromTemplate(
  templateKey: string,
  userId: string,
  variables: Record<string, string>,
  options?: Partial<CreateNotificationRequest>
) {
  const template = NOTIFICATION_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`Notification template '${templateKey}' not found`);
  }

  // Replace template variables
  let title = template.title_template;
  let message = template.message_template;

  Object.entries(variables).forEach(([key, value]) => {
    title = title.replace(`{${key}}`, value);
    message = message.replace(`{${key}}`, value);
  });

  const notificationData: CreateNotificationRequest = {
    user_id: userId,
    type: template.type as any,
    title,
    message,
    action_label: template.action_label,
    icon: template.icon,
    priority: template.priority,
    ...options
  };

  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationData)
    });

    if (!response.ok) {
      throw new Error('Failed to create notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating notification from template:', error);
    throw error;
  }
} 