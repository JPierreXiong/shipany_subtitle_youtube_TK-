import { getMDXComponents } from '@/mdx-components';
import { and, count, desc, eq, like } from 'drizzle-orm';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import moment from 'moment';

import { db } from '@/core/db';
import { generateTOC } from '@/core/docs/toc';

// Safely import postsSource and pagesSource - they may not exist if .source folder is not generated
let postsSource: any = null;
let pagesSource: any = null;
try {
  // Use require for dynamic import in case .source folder doesn't exist
  const sourceModule = require('@/core/docs/source');
  postsSource = sourceModule.postsSource;
  pagesSource = sourceModule.pagesSource;
} catch (error) {
  // postsSource/pagesSource not available, will use empty array
  console.warn('postsSource/pagesSource not available, local posts/pages will be skipped');
}
import { post } from '@/config/db/schema';
import { MarkdownContent } from '@/shared/blocks/common/markdown-content';
import {
  Category as BlogCategoryType,
  Post as BlogPostType,
} from '@/shared/types/blocks/blog';

import { getTaxonomies, TaxonomyStatus, TaxonomyType } from './taxonomy';

export type Post = typeof post.$inferSelect;
export type NewPost = typeof post.$inferInsert;
export type UpdatePost = Partial<Omit<NewPost, 'id' | 'createdAt'>>;

export enum PostType {
  ARTICLE = 'article',
  PAGE = 'page',
}

export enum PostStatus {
  PUBLISHED = 'published', // published and visible to the public
  PENDING = 'pending', // pending review by admin
  DRAFT = 'draft', // draft and not visible to the public
  ARCHIVED = 'archived', // archived means deleted
}

export async function addPost(data: NewPost) {
  const [result] = await db().insert(post).values(data).returning();

  return result;
}

export async function updatePost(id: string, data: UpdatePost) {
  const [result] = await db()
    .update(post)
    .set(data)
    .where(eq(post.id, id))
    .returning();

  return result;
}

export async function deletePost(id: string) {
  const result = await updatePost(id, {
    status: PostStatus.ARCHIVED,
  });

  return result;
}

export async function findPost({
  id,
  slug,
  status,
}: {
  id?: string;
  slug?: string;
  status?: PostStatus;
}) {
  const [result] = await db()
    .select()
    .from(post)
    .where(
      and(
        id ? eq(post.id, id) : undefined,
        slug ? eq(post.slug, slug) : undefined,
        status ? eq(post.status, status) : undefined
      )
    )
    .limit(1);

  return result;
}

export async function getPosts({
  type,
  status,
  category,
  tag,
  page = 1,
  limit = 30,
}: {
  type?: PostType;
  status?: PostStatus;
  category?: string;
  tag?: string[];
  page?: number;
  limit?: number;
} = {}): Promise<Post[]> {
  try {
    // Try to get database connection
    let dbConnection;
    try {
      dbConnection = db();
    } catch (dbError: any) {
      // If DATABASE_URL is not set or connection fails, return empty array
      console.error('Database connection failed in getPosts:', dbError?.message || dbError);
      return [];
    }

    const result = await dbConnection
      .select()
      .from(post)
      .where(
        and(
          type ? eq(post.type, type) : undefined,
          status ? eq(post.status, status) : undefined,
          category ? like(post.categories, `%${category}%`) : undefined,
          tag ? like(post.tags, `%${tag}%`) : undefined
        )
      )
      .orderBy(desc(post.updatedAt), desc(post.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return result || [];
  } catch (error: any) {
    // Log the error but don't crash - return empty array instead
    console.error('getPosts failed:', error?.message || error);
    return [];
  }
}

export async function getPostsCount({
  type,
  status,
  category,
  tag,
}: {
  type?: PostType;
  status?: PostStatus;
  category?: string;
  tag?: string;
} = {}): Promise<number> {
  const [result] = await db()
    .select({ count: count() })
    .from(post)
    .where(
      and(
        type ? eq(post.type, type) : undefined,
        status ? eq(post.status, status) : undefined,
        category ? like(post.categories, `%${category}%`) : undefined,
        tag ? like(post.tags, `%${tag}%`) : undefined
      )
    )
    .limit(1);

  return result?.count || 0;
}

// get single post, both from local file and database
// database post has higher priority
export async function getPost({
  slug,
  locale,
  postPrefix = '/blog/',
}: {
  slug: string;
  locale: string;
  postPrefix?: string;
}): Promise<BlogPostType | null> {
  let post: BlogPostType | null = null;

  try {
    // get post from database
    const postData = await findPost({ slug, status: PostStatus.PUBLISHED });
    if (postData) {
      // post exist in database
      const content = postData.content || '';

      // Convert markdown content to MarkdownContent component
      const body = content ? <MarkdownContent content={content} /> : undefined;

      // Generate TOC from content
      const toc = content ? generateTOC(content) : undefined;

      post = {
        id: postData.id,
        slug: postData.slug,
        title: postData.title || '',
        description: postData.description || '',
        content: '',
        body: body,
        toc: toc,
        created_at:
          getPostDate({
            created_at: postData.createdAt.toISOString(),
            locale,
          }) || '',
        author_name: postData.authorName || '',
        author_image: postData.authorImage || '',
        author_role: '',
        url: `${postPrefix}${postData.slug}`,
      };

      return post;
    }
  } catch (e) {
    console.log('get post from database failed:', e);
  }

  // get post from locale file
  const localPost = await getLocalPost({ slug, locale, postPrefix });

  return localPost;
}

export async function getLocalPost({
  slug,
  locale,
  postPrefix = '/blog/',
}: {
  slug: string;
  locale: string;
  postPrefix?: string;
}): Promise<BlogPostType | null> {
  const localPost = await postsSource.getPage([slug], locale);
  if (!localPost) {
    return null;
  }

  const MDXContent = localPost.data.body;
  const body = (
    <MDXContent
      components={getMDXComponents({
        // this allows you to link to other pages with relative file paths
        a: createRelativeLink(postsSource, localPost),
      })}
    />
  );

  const frontmatter = localPost.data as any;

  const post: BlogPostType = {
    id: localPost.path,
    slug: slug,
    title: localPost.data.title || '',
    description: localPost.data.description || '',
    content: '',
    body: body,
    toc: localPost.data.toc, // Use fumadocs auto-generated TOC
    created_at: frontmatter.created_at
      ? getPostDate({
          created_at: frontmatter.created_at,
          locale,
        })
      : '',
    author_name: frontmatter.author_name || '',
    author_image: frontmatter.author_image || '',
    author_role: '',
    url: `${postPrefix}${slug}`,
  };

  return post;
}

// get local page from: content/pages/*.md
export async function getLocalPage({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}): Promise<BlogPostType | null> {
  if (!pagesSource) {
    return null;
  }
  
  const localPage = await pagesSource.getPage([slug], locale);
  if (!localPage) {
    return null;
  }

  const MDXContent = localPage.data.body;
  const body = (
    <MDXContent
      components={getMDXComponents({
        // this allows you to link to other pages with relative file paths
        a: createRelativeLink(pagesSource, localPage),
      })}
    />
  );

  const frontmatter = localPage.data as any;

  const post: BlogPostType = {
    id: localPage.path,
    slug: slug,
    title: localPage.data.title || '',
    description: localPage.data.description || '',
    content: '',
    body: body,
    toc: localPage.data.toc, // Use fumadocs auto-generated TOC
    created_at: frontmatter.created_at
      ? getPostDate({
          created_at: frontmatter.created_at,
          locale,
        })
      : '',
    author_name: frontmatter.author_name || '',
    author_image: frontmatter.author_image || '',
    author_role: '',
    url: `/${locale}/${slug}`,
  };

  return post;
}

// get posts and categories, both from local files and database
export async function getPostsAndCategories({
  page = 1,
  limit = 30,
  locale,
  postPrefix = '/blog/',
  categoryPrefix = '/blog/category/',
}: {
  page?: number;
  limit?: number;
  locale: string;
  postPrefix?: string;
  categoryPrefix?: string;
}) {
  let posts: BlogPostType[] = [];
  let categories: BlogCategoryType[] = [];

  try {
    // merge posts from both locale and remote, remove duplicates by slug
    // remote posts have higher priority
    const postsMap = new Map<string, BlogPostType>();

    // 1. get local posts
    let localPosts: BlogPostType[] = [];
    let localCategories: BlogCategoryType[] = [];
    try {
      const localResult = await getLocalPostsAndCategories({
        locale,
        postPrefix,
        categoryPrefix,
      });
      localPosts = localResult.posts || [];
      localCategories = localResult.categories || [];
    } catch (error) {
      console.error('getLocalPostsAndCategories failed:', error);
    }

    // add local posts to postsMap
    localPosts.forEach((post) => {
      if (post.slug) {
        postsMap.set(post.slug, post);
      }
    });

    // 2. get remote posts
    let remotePosts: BlogPostType[] = [];
    let remoteCategories: BlogCategoryType[] = [];
    try {
      // Add timeout for database queries
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 8000)
      );

      const remoteResult = await Promise.race([
        getRemotePostsAndCategories({
          page,
          limit,
          locale,
          postPrefix,
          categoryPrefix,
        }),
        timeoutPromise,
      ]);

      remotePosts = remoteResult.posts || [];
      remoteCategories = remoteResult.categories || [];
    } catch (error) {
      console.error('getRemotePostsAndCategories failed:', error);
      // Continue with empty arrays on error
      remotePosts = [];
      remoteCategories = [];
    }

    // add remote posts to postsMap
    remotePosts.forEach((post) => {
      if (post.slug) {
        postsMap.set(post.slug, post);
      }
    });

    // Convert map to array and sort by created_at desc
    posts = Array.from(postsMap.values()).sort((a, b) => {
      try {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      } catch (error) {
        // If date parsing fails, maintain original order
        return 0;
      }
    });

    // Merge local and remote categories, avoiding duplicates
    const categoriesMap = new Map<string, BlogCategoryType>();
    localCategories.forEach((cat) => {
      if (cat.slug) {
        categoriesMap.set(cat.slug, cat);
      }
    });
    remoteCategories.forEach((cat) => {
      if (cat.slug) {
        categoriesMap.set(cat.slug, cat);
      }
    });
    categories = Array.from(categoriesMap.values());
  } catch (error) {
    console.error('getPostsAndCategories failed:', error);
    // Return empty arrays on error
    posts = [];
    categories = [];
  }

  return {
    posts,
    postsCount: posts.length,
    categories,
    categoriesCount: categories.length,
  };
}

// get remote posts and categories
export async function getRemotePostsAndCategories({
  page = 1,
  limit = 30,
  locale,
  postPrefix = '/blog/',
  categoryPrefix = '/blog/category/',
}: {
  page?: number;
  limit?: number;
  locale: string;
  postPrefix?: string;
  categoryPrefix?: string;
}) {
  const dbPostsList: BlogPostType[] = [];
  const dbCategoriesList: BlogCategoryType[] = [];

  try {
    // get posts from database
    let dbPosts: Post[] = [];
    try {
      dbPosts = await getPosts({
        type: PostType.ARTICLE,
        status: PostStatus.PUBLISHED,
        page,
        limit,
      });
    } catch (dbError: any) {
      // If database connection fails, log and continue with empty array
      console.error('Database query failed in getRemotePostsAndCategories:', dbError?.message || dbError);
      // Return empty arrays instead of crashing
      return {
        posts: [],
        postsCount: 0,
        categories: [],
        categoriesCount: 0,
      };
    }

    if (!dbPosts || dbPosts.length === 0) {
      return {
        posts: [],
        postsCount: 0,
        categories: [],
        categoriesCount: 0,
      };
    }

    dbPostsList.push(
      ...dbPosts.map((post) => ({
        id: post.id,
        slug: post.slug,
        title: post.title || '',
        description: post.description || '',
        author_name: post.authorName || '',
        author_image: post.authorImage || '',
        created_at:
          getPostDate({
            created_at: post.createdAt.toISOString(),
            locale,
          }) || '',
        image: post.image || '',
        url: `${postPrefix}${post.slug}`,
      }))
    );

    // get categories from database
    let dbCategories: any[] = [];
    try {
      dbCategories = await getTaxonomies({
        type: TaxonomyType.CATEGORY,
        status: TaxonomyStatus.PUBLISHED,
      });
    } catch (dbError: any) {
      // If database query fails, log and continue with empty array
      console.error('Database query failed for categories:', dbError?.message || dbError);
      dbCategories = [];
    }

    dbCategoriesList.push(
      ...(dbCategories || []).map((category) => ({
        id: category.id,
        slug: category.slug,
        title: category.title,
        url: `${categoryPrefix}${category.slug}`,
      }))
    );
  } catch (e) {
    console.log('get remote posts and categories failed:', e);
  }

  return {
    posts: dbPostsList,
    postsCount: dbPostsList.length,
    categories: dbCategoriesList,
    categoriesCount: dbCategoriesList.length,
  };
}

// get local posts and categories
export async function getLocalPostsAndCategories({
  locale,
  postPrefix = '/blog/',
  categoryPrefix = '/blog/category/',
}: {
  locale: string;
  postPrefix?: string;
  categoryPrefix?: string;
}) {
  const localPostsList: BlogPostType[] = [];

  try {
    // Try to dynamically load postsSource if not already loaded
    if (!postsSource) {
      try {
        const sourceModule = await import('@/core/docs/source');
        postsSource = sourceModule.postsSource;
      } catch (importError) {
        // postsSource not available
        return {
          posts: [],
          postsCount: 0,
          categories: [],
          categoriesCount: 0,
        };
      }
    }

    // Check if postsSource exists and has getPages method
    if (!postsSource || typeof postsSource.getPages !== 'function') {
      return {
        posts: [],
        postsCount: 0,
        categories: [],
        categoriesCount: 0,
      };
    }

    // get posts from local files
    const localPosts = postsSource.getPages(locale);

    // no local posts
    if (!localPosts || localPosts.length === 0) {
      return {
        posts: [],
        postsCount: 0,
        categories: [],
        categoriesCount: 0,
      };
    }

    // Build posts data from local content
    localPostsList.push(
      ...localPosts.map((post: any) => {
        try {
          const frontmatter = post.data as any;
          const slug = getPostSlug({
            url: post.url,
            locale,
            prefix: postPrefix,
          });

          return {
            id: post.path,
            slug: slug,
            title: post.data.title || '',
            description: post.data.description || '',
            author_name: frontmatter.author_name || '',
            author_image: frontmatter.author_image || '',
            created_at: frontmatter.created_at
              ? getPostDate({
                  created_at: frontmatter.created_at,
                  locale,
                })
              : '',
            image: frontmatter.image || '',
            url: `${postPrefix}${slug}`,
          };
        } catch (error) {
          console.error('Error processing local post:', error);
          return null;
        }
      }).filter((post: any): post is BlogPostType => post !== null)
    );
  } catch (error) {
    console.error('getLocalPostsAndCategories failed:', error);
    // Return empty arrays on error
  }

  return {
    posts: localPostsList,
    postsCount: localPostsList.length,
    categories: [],
    categoriesCount: 0,
  };
}

// Helper function to replace slug for local posts
export function getPostSlug({
  url,
  locale,
  prefix = '/blog/',
}: {
  url: string; // post url, like: /zh/blog/what-is-xxx
  locale: string; // locale
  prefix?: string; // post slug prefix
}): string {
  if (url.startsWith(prefix)) {
    return url.replace(prefix, '');
  } else if (url.startsWith(`/${locale}${prefix}`)) {
    return url.replace(`/${locale}${prefix}`, '');
  }

  return url;
}

export function getPostDate({
  created_at,
  locale,
}: {
  created_at: string;
  locale?: string;
}) {
  return moment(created_at)
    .locale(locale || 'en')
    .format(locale === 'zh' ? 'YYYY/MM/DD' : 'MMM D, YYYY');
}

// Helper function to remove frontmatter from markdown content
export function removePostFrontmatter(content: string): string {
  // Match frontmatter pattern: ---\n...content...\n---
  const frontmatterRegex = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;
  return content.replace(frontmatterRegex, '').trim();
}
