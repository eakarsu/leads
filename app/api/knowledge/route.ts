import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');
    const isPublic = searchParams.get('isPublic');
    const search = searchParams.get('search');

    const where: any = {};

    // Non-authenticated users can only see public published articles
    if (!session) {
      where.isPublic = true;
      where.status = 'PUBLISHED';
    } else {
      if (status) where.status = status;
      if (isPublic !== null) where.isPublic = isPublic === 'true';
    }

    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { keywords: { has: search } },
      ];
    }

    const articles = await prisma.knowledgeArticle.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    // Fetch categories for articles
    const categoryIds = [...new Set(articles.map(a => a.categoryId).filter(Boolean))] as string[];
    const categories = categoryIds.length > 0 ? await prisma.knowledgeCategory.findMany({
      where: { id: { in: categoryIds } },
    }) : [];
    const categoryMap = new Map(categories.map(c => [c.id, c]));

    // Add category info to articles
    const articlesWithCategory = articles.map(article => ({
      ...article,
      category: article.categoryId ? categoryMap.get(article.categoryId) || null : null,
    }));

    // Calculate stats
    const stats = {
      totalArticles: articlesWithCategory.length,
      publishedArticles: articlesWithCategory.filter(a => a.status === 'PUBLISHED').length,
      draftArticles: articlesWithCategory.filter(a => a.status === 'DRAFT').length,
      publicArticles: articlesWithCategory.filter(a => a.isPublic).length,
    };

    return NextResponse.json({ articles: articlesWithCategory, stats });
  } catch (error: any) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, summary, content, categoryId, keywords, isPublic } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // Generate article number
    const articleCount = await prisma.knowledgeArticle.count();
    const articleNumber = `KB-${String(articleCount + 1).padStart(6, '0')}`;

    const article = await prisma.knowledgeArticle.create({
      data: {
        articleNumber,
        title,
        summary,
        content,
        categoryId,
        authorId: session.user.id,
        keywords: keywords || [],
        isPublic: isPublic || false,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error: any) {
    console.error('Error creating article:', error);
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
  }
}
