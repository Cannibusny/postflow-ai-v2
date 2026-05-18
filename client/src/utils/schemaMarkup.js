/**
 * Schema.org markup builders for PostFlow AI.
 */

export function buildOrganizationSchema(account) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: account.name || account.business_name || 'PostFlow AI Client',
    description: account.description || 'Social media management powered by PostFlow AI',
  };

  if (account.website || account.url) {
    schema.url = account.website || account.url;
  }

  if (account.address) {
    schema.address = {
      '@type': 'PostalAddress',
      ...(account.address.street && { streetAddress: account.address.street }),
      ...(account.address.city && { addressLocality: account.address.city }),
      ...(account.address.state && { addressRegion: account.address.state }),
      ...(account.address.zip && { postalCode: account.address.zip }),
      addressCountry: 'US',
    };
  }

  const sameAs = [];
  if (account.instagram_url) sameAs.push(account.instagram_url);
  if (account.facebook_url) sameAs.push(account.facebook_url);
  if (account.twitter_url) sameAs.push(account.twitter_url);
  if (account.linkedin_url) sameAs.push(account.linkedin_url);
  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  return schema;
}

export function buildSocialMediaPostingSchema(post) {
  const variant = post.caption_variants?.[post.selected_variant || 0];
  const captionText = variant?.caption_text || '';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SocialMediaPosting',
    headline: post.title || captionText.slice(0, 100),
    articleBody: captionText,
    datePublished: post.scheduled_date
      ? new Date(post.scheduled_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    author: {
      '@type': 'Organization',
      name: 'PostFlow AI',
    },
  };

  if (post.image_url) {
    schema.image = post.image_url;
  }

  if (post.media_urls?.length > 0) {
    schema.image = post.media_urls;
  }

  return schema;
}

export function buildImageGallerySchema(posts) {
  const images = [];
  for (const post of posts) {
    if (post.image_url) images.push(post.image_url);
    if (post.media_urls) images.push(...post.media_urls);
  }

  if (images.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: 'PostFlow AI Content Library',
    description: 'Social media content created by PostFlow AI',
    image: [...new Set(images)],
  };
}

export function buildPostListSchemas(posts) {
  return posts.slice(0, 30).map(buildSocialMediaPostingSchema);
}
