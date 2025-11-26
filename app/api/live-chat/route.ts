import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List live chats and queues
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const agentId = searchParams.get('agentId');
    const type = searchParams.get('type'); // 'chats', 'queues', 'presence'

    if (type === 'queues') {
      const queues = await prisma.routingQueue.findMany({
        where: { isActive: true },
        orderBy: { priority: 'desc' },
      });
      return NextResponse.json({ queues });
    }

    if (type === 'presence') {
      const presence = await prisma.omnichannelPresence.findMany();

      // Fetch user data separately
      const userIds = presence.map(p => p.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      });
      const userMap = new Map(users.map(u => [u.id, u]));

      // Get agent workloads
      const agentWorkloads = await Promise.all(
        presence.map(async (p) => {
          const activeChats = await prisma.liveChat.count({
            where: {
              agentId: p.userId,
              status: { in: ['ACTIVE', 'WAITING'] },
            },
          });
          return {
            ...p,
            user: userMap.get(p.userId),
            activeChats,
          };
        })
      );

      return NextResponse.json({ presence: agentWorkloads });
    }

    // Get live chats
    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (agentId) {
      whereClause.agentId = agentId;
    }

    const chats = await prisma.liveChat.findMany({
      where: whereClause,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate stats
    const stats = {
      totalChats: chats.length,
      activeChats: chats.filter(c => c.status === 'ACTIVE').length,
      waitingChats: chats.filter(c => c.status === 'WAITING').length,
      avgWaitTime: 0,
      avgDuration: 0,
    };

    return NextResponse.json({ chats, stats });
  } catch (error) {
    console.error('Error fetching live chats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new chat, queue, or update presence
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;

    if (type === 'queue') {
      const { name, description, priority, routingType, requiredSkills, memberIds, channel } = body;

      const queue = await prisma.routingQueue.create({
        data: {
          name,
          description,
          channel: channel || 'WEB',
          priority: priority || 1,
          routingType: routingType || 'ROUND_ROBIN',
          requiredSkills: requiredSkills || [],
          memberIds: memberIds || [],
          isActive: true,
        },
      });

      return NextResponse.json(queue, { status: 201 });
    }

    if (type === 'presence') {
      const { status, capacity, channels, skills } = body;

      // Upsert presence
      const presence = await prisma.omnichannelPresence.upsert({
        where: { userId: session.user.id },
        update: {
          status,
          capacity,
          channels: channels || ['WEB'],
          skills: skills || [],
          lastActivityAt: new Date(),
        },
        create: {
          userId: session.user.id,
          status: status || 'OFFLINE',
          capacity: capacity || 5,
          channels: channels || ['WEB'],
          skills: skills || [],
        },
      });

      return NextResponse.json(presence, { status: 201 });
    }

    if (type === 'message') {
      const { chatId, content, senderType } = body;

      const message = await prisma.liveChatMessage.create({
        data: {
          chatId,
          content,
          senderType: senderType || 'VISITOR',
          senderId: session.user.id,
          messageType: 'TEXT',
        },
      });

      // Update chat's last activity
      await prisma.liveChat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      });

      return NextResponse.json(message, { status: 201 });
    }

    // Create new chat
    const { visitorName, visitorEmail, channel, initialMessage } = body;

    // Find available agent
    let agentId = null;
    const availableAgent = await prisma.omnichannelPresence.findFirst({
      where: {
        status: 'ONLINE',
        channels: { has: channel || 'WEB' },
      },
      orderBy: { currentLoad: 'asc' },
    });

    if (availableAgent) {
      agentId = availableAgent.userId;
      // Increment agent load
      await prisma.omnichannelPresence.update({
        where: { id: availableAgent.id },
        data: { currentLoad: availableAgent.currentLoad + 1 },
      });
    }

    const chat = await prisma.liveChat.create({
      data: {
        visitorName,
        visitorEmail,
        agentId,
        channel: channel || 'WEB',
        status: agentId ? 'ACTIVE' : 'WAITING',
      },
    });

    // Add initial message if provided
    if (initialMessage) {
      await prisma.liveChatMessage.create({
        data: {
          chatId: chat.id,
          content: initialMessage,
          senderType: 'VISITOR',
          messageType: 'TEXT',
        },
      });
    }

    const createdChat = await prisma.liveChat.findUnique({
      where: { id: chat.id },
      include: {
        messages: true,
      },
    });

    return NextResponse.json(createdChat, { status: 201 });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update chat, queue, or transfer chat
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, type } = body;

    if (type === 'queue') {
      const { name, description, priority, routingType, requiredSkills, memberIds, isActive } = body;

      const queue = await prisma.routingQueue.update({
        where: { id },
        data: {
          name,
          description,
          priority,
          routingType,
          requiredSkills,
          memberIds,
          isActive,
        },
      });

      return NextResponse.json(queue);
    }

    if (type === 'transfer') {
      const { chatId, newAgentId } = body;

      const chat = await prisma.liveChat.update({
        where: { id: chatId },
        data: {
          agentId: newAgentId,
          status: newAgentId ? 'ACTIVE' : 'WAITING',
        },
      });

      return NextResponse.json(chat);
    }

    // Update chat status
    const { status, caseId, rating, ratingComment } = body;

    const updateData: any = { status };

    if (status === 'ENDED') {
      updateData.endedAt = new Date();
    }

    if (caseId) {
      updateData.caseId = caseId;
    }

    if (rating !== undefined) {
      updateData.rating = rating;
    }

    if (ratingComment) {
      updateData.ratingComment = ratingComment;
    }

    const chat = await prisma.liveChat.update({
      where: { id },
      data: updateData,
      include: {
        messages: true,
      },
    });

    return NextResponse.json(chat);
  } catch (error) {
    console.error('Error updating chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete chat or queue
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

    if (type === 'queue') {
      await prisma.routingQueue.delete({
        where: { id },
      });
    } else {
      // Delete messages first
      await prisma.liveChatMessage.deleteMany({
        where: { chatId: id },
      });

      await prisma.liveChat.delete({
        where: { id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
