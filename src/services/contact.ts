import { ContactMessage } from '../models';
import type { ContactMessageCreationAttributes } from '../models/ContactMessage';

export interface CreateContactMessageInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

class ContactService {
  async createContactMessage(
    data: CreateContactMessageInput,
    userId?: string | null
  ): Promise<ContactMessage> {
    const attrs: ContactMessageCreationAttributes = {
      user_id: userId ?? null,
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
    };

    return ContactMessage.create(attrs);
  }
}

export default new ContactService();
