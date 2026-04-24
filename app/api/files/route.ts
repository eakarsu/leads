import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List files and folders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const search = searchParams.get('search');

    // Get folders
    const folders = await prisma.fileFolder.findMany({
      where: {
        parentId: folderId || null,
        OR: search ? [
          { name: { contains: search, mode: 'insensitive' } },
        ] : undefined,
      },
      include: {
        _count: {
          select: { files: true, children: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Fetch owners for folders
    const folderOwnerIds = [...new Set(folders.map(f => f.ownerId))];
    const folderOwners = await prisma.user.findMany({
      where: { id: { in: folderOwnerIds } },
      select: { id: true, name: true },
    });
    const folderOwnerMap = new Map(folderOwners.map(o => [o.id, o]));

    const foldersWithOwner = folders.map(f => ({
      ...f,
      owner: folderOwnerMap.get(f.ownerId),
    }));

    // Get files
    const fileWhere: any = {
      folderId: folderId || null,
    };

    if (search) {
      fileWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const files = await prisma.file.findMany({
      where: fileWhere,
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
        _count: {
          select: { versions: true, links: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Fetch owners for files
    const fileOwnerIds = [...new Set(files.map(f => f.ownerId))];
    const fileOwners = await prisma.user.findMany({
      where: { id: { in: fileOwnerIds } },
      select: { id: true, name: true },
    });
    const fileOwnerMap = new Map(fileOwners.map(o => [o.id, o]));

    const filesWithOwner = files.map(f => ({
      ...f,
      owner: fileOwnerMap.get(f.ownerId),
    }));

    // Get recent files
    const recentFiles = await prisma.file.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
    });

    const recentOwnerIds = [...new Set(recentFiles.map(f => f.ownerId))];
    const recentOwners = await prisma.user.findMany({
      where: { id: { in: recentOwnerIds } },
      select: { id: true, name: true },
    });
    const recentOwnerMap = new Map(recentOwners.map(o => [o.id, o]));

    const recentFilesWithOwner = recentFiles.map(f => ({
      ...f,
      owner: recentOwnerMap.get(f.ownerId),
    }));

    // Calculate storage stats
    const storageStats = await prisma.file.aggregate({
      _sum: { fileSize: true },
      _count: true,
    });

    return NextResponse.json({
      folders: foldersWithOwner,
      files: filesWithOwner,
      recentFiles: recentFilesWithOwner,
      stats: {
        totalFiles: storageStats._count,
        totalSize: storageStats._sum.fileSize || 0,
        totalFolders: await prisma.fileFolder.count(),
      },
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Upload a new file or create folder
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, name, description, folderId, contentType, fileSize, storageUrl, isPublic } = body;

    if (type === 'folder') {
      const folder = await prisma.fileFolder.create({
        data: {
          name,
          parentId: folderId,
          ownerId: session.user.id,
          isShared: isPublic || false,
        },
      });
      return NextResponse.json(folder, { status: 201 });
    }

    // Create file
    const file = await prisma.file.create({
      data: {
        name,
        description,
        contentType: contentType || 'application/octet-stream',
        fileType: contentType?.split('/')[1] || 'unknown',
        fileSize: fileSize || 0,
        storageUrl,
        folderId,
        ownerId: session.user.id,
        isPublic: isPublic || false,
      },
    });

    // Create initial version
    await prisma.fileVersion.create({
      data: {
        fileId: file.id,
        version: 1,
        storageUrl,
        fileSize: fileSize || 0,
        uploadedBy: session.user.id,
        changeNotes: 'Initial upload',
      },
    });

    return NextResponse.json(file, { status: 201 });
  } catch (error) {
    console.error('Error creating file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update file or folder
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, type, name, description, folderId, isPublic, newVersion } = body;

    if (type === 'folder') {
      const folder = await prisma.fileFolder.update({
        where: { id },
        data: {
          name,
          parentId: folderId,
          isShared: isPublic,
        },
      });
      return NextResponse.json(folder);
    }

    // Update file - build update data, only include fields that are provided
    const fileUpdateData: Record<string, any> = {};
    if (name !== undefined) fileUpdateData.name = name;
    if (description !== undefined) fileUpdateData.description = description;
    if (folderId !== undefined) fileUpdateData.folderId = folderId;
    if (isPublic !== undefined) fileUpdateData.isPublic = isPublic;

    const file = await prisma.file.update({
      where: { id },
      data: fileUpdateData,
    });

    // Add new version if provided
    if (newVersion) {
      const latestVersion = await prisma.fileVersion.findFirst({
        where: { fileId: id },
        orderBy: { version: 'desc' },
      });

      await prisma.fileVersion.create({
        data: {
          fileId: id,
          version: (latestVersion?.version || 0) + 1,
          storageUrl: newVersion.storageUrl,
          fileSize: newVersion.fileSize || 0,
          uploadedBy: session.user.id,
          changeNotes: newVersion.changeDescription,
        },
      });

      // Update file size and version
      await prisma.file.update({
        where: { id },
        data: {
          fileSize: newVersion.fileSize,
          version: (latestVersion?.version || 0) + 1,
        },
      });
    }

    return NextResponse.json(file);
  } catch (error) {
    console.error('Error updating file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete file or folder
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    if (type === 'folder') {
      // Delete folder and all contents
      await prisma.fileFolder.delete({
        where: { id },
      });
    } else {
      // Delete file versions and links first
      await prisma.fileVersion.deleteMany({ where: { fileId: id } });
      await prisma.fileLink.deleteMany({ where: { fileId: id } });
      await prisma.file.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
