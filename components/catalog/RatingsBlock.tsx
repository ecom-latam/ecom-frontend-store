import { StarRating } from 'zoui';
import type { ProductReview, ReviewDistribution } from '@/lib/api/storeClient';

interface RatingsBlockProps {
  avgRating: number | null;
  total: number;
  reviews: ProductReview[];
  distribution: ReviewDistribution | null;
  ratingsEnabled: boolean;
  reviewsEnabled: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getBuyerDisplay(email?: string): { initial: string; name: string } {
  if (!email) return { initial: 'C', name: 'Comprador verificado' };
  const prefix = email.split('@')[0] ?? '';
  const display = prefix.replace(/[._-]/g, ' ').trim();
  return { initial: display[0]?.toUpperCase() ?? 'C', name: display || 'Comprador verificado' };
}

function DistributionBars({
  distribution,
  total,
}: {
  distribution: ReviewDistribution;
  total: number;
}) {
  const rows = [5, 4, 3, 2, 1] as const;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '180px' }}>
      {rows.map((star) => {
        const count = distribution[star] ?? 0;
        const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StarRating value={star} readonly size="sm" />
            <div
              style={{
                flex: 1,
                height: '8px',
                borderRadius: '9999px',
                background: 'var(--color-bg-subtle)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  borderRadius: '9999px',
                  background: 'var(--color-brand-400)',
                  transition: 'width 300ms ease',
                }}
              />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '12px',
                color: 'var(--color-fg-secondary)',
                minWidth: '28px',
                textAlign: 'right',
              }}
            >
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ReviewCard({
  review,
}: {
  review: ProductReview;
}) {
  const { initial, name } = getBuyerDisplay(review.buyerEmail);
  return (
    <div
      style={{
        padding: '16px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border-subtle)',
        background: 'var(--color-bg-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--color-brand-100)',
            color: 'var(--color-brand-700)',
            fontFamily: 'var(--font-ui)',
            fontWeight: 600,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {initial}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-fg-primary)',
              textTransform: 'capitalize',
            }}
          >
            {name}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '12px',
              color: 'var(--color-fg-disabled)',
            }}
          >
            {formatDate(review.createdAt)}
          </span>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <StarRating value={review.rating} readonly size="sm" />
        </div>
      </div>

      {review.title && (
        <p
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--color-fg-primary)',
            margin: 0,
          }}
        >
          {review.title}
        </p>
      )}

      {review.body && (
        <p
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '14px',
            color: 'var(--color-fg-secondary)',
            margin: 0,
            lineHeight: 1.55,
          }}
        >
          {review.body}
        </p>
      )}
    </div>
  );
}

export function RatingsBlock({
  avgRating,
  total,
  reviews,
  distribution,
  ratingsEnabled,
  reviewsEnabled,
}: RatingsBlockProps) {
  if (!ratingsEnabled && !reviewsEnabled) return null;

  const hasRatings = ratingsEnabled && avgRating !== null && total > 0;
  const hasReviews = reviewsEnabled && reviews.length > 0;

  if (!hasRatings && !hasReviews) {
    if (!reviewsEnabled) return null;
    return (
      <section style={{ marginTop: '48px' }}>
        <h2
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--color-fg-primary)',
            marginBottom: '16px',
          }}
        >
          Reseñas
        </h2>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: '14px', color: 'var(--color-fg-secondary)' }}>
          Todavía no hay reseñas para este producto.
        </p>
      </section>
    );
  }

  return (
    <section style={{ marginTop: '48px' }}>
      <h2
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--color-fg-primary)',
          marginBottom: '24px',
        }}
      >
        Reseñas
      </h2>

      {/* Summary: big score + distribution bars */}
      {hasRatings && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            marginBottom: '32px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '48px',
                fontWeight: 700,
                color: 'var(--color-fg-primary)',
                lineHeight: 1,
              }}
            >
              {avgRating!.toFixed(1)}
            </span>
            <StarRating value={avgRating!} readonly showValue={false} size="md" />
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: '13px', color: 'var(--color-fg-secondary)' }}>
              {total} {total === 1 ? 'reseña' : 'reseñas'}
            </span>
          </div>

          {distribution && (
            <DistributionBars distribution={distribution} total={total} />
          )}
        </div>
      )}

      {/* Review cards */}
      {hasReviews && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px',
          }}
        >
          {reviews.map((r) => (
            <ReviewCard key={r._id} review={r} />
          ))}
        </div>
      )}

      {reviewsEnabled && total > reviews.length && (
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: '13px', color: 'var(--color-fg-secondary)' }}>
            Mostrando {reviews.length} de {total} reseñas
          </span>
        </div>
      )}
    </section>
  );
}
