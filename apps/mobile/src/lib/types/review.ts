// Mirrors packages/domain/src/reviews/queries.ts's listBusinessReviews shape.

export interface BusinessReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: { firstName: string | null; lastName: string | null; avatarUrl: string | null };
  appointment: {
    requestedDate: string;
    requestedTime: string;
    service: { name: string };
  };
}
