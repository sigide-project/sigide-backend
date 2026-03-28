import { Feedback } from '../models';
import type { FeedbackCreationAttributes } from '../models/Feedback';

export interface CreateFeedbackInput {
  rating?: number | null;
  name?: string;
  email?: string;
  feedback: string;
}

class FeedbackService {
  async createFeedback(
    data: CreateFeedbackInput,
    userId?: string | null
  ): Promise<Feedback> {
    const attrs: FeedbackCreationAttributes = {
      user_id: userId ?? null,
      rating: data.rating ?? null,
      name: data.name ?? null,
      email: data.email ?? null,
      feedback: data.feedback,
    };

    return Feedback.create(attrs);
  }
}

export default new FeedbackService();
