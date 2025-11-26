import { prisma } from '../lib/prisma';

async function main() {
  console.log('💬 Seeding Chatter/Feed data...');

  // Get existing users
  const users = await prisma.user.findMany();

  if (users.length === 0) {
    console.log('⚠️  No users found. Please run main seed first.');
    return;
  }

  console.log(`Found ${users.length} users`);

  // Clear existing chatter data
  await prisma.feedMention.deleteMany({});
  await prisma.feedLike.deleteMany({});
  await prisma.feedComment.deleteMany({});
  await prisma.feedItem.deleteMany({});
  await prisma.groupMember.deleteMany({});
  await prisma.chatterGroup.deleteMany({});
  console.log('Cleared existing chatter data');

  // Create Chatter Groups
  const groupsData = [
    {
      name: 'Sales Team',
      description: 'Collaboration space for the sales team to share wins, strategies, and best practices.',
      isPublic: true,
      ownerId: users[0].id,
    },
    {
      name: 'Marketing Hub',
      description: 'Marketing team discussions, campaign updates, and creative brainstorming.',
      isPublic: true,
      ownerId: users[1 % users.length].id,
    },
    {
      name: 'Support Heroes',
      description: 'Customer support team channel for case discussions and knowledge sharing.',
      isPublic: true,
      ownerId: users[2 % users.length].id,
    },
    {
      name: 'Product Updates',
      description: 'Official product announcements and feature releases.',
      isPublic: true,
      ownerId: users[0].id,
    },
    {
      name: 'Leadership',
      description: 'Private group for leadership team discussions and strategic planning.',
      isPublic: false,
      ownerId: users[0].id,
    },
    {
      name: 'Water Cooler',
      description: 'Casual conversations, team bonding, and fun discussions.',
      isPublic: true,
      ownerId: users[3 % users.length].id,
    },
  ];

  const createdGroups = [];
  for (const group of groupsData) {
    const created = await prisma.chatterGroup.create({
      data: {
        ...group,
        memberCount: 0,
      },
    });
    createdGroups.push(created);
  }
  console.log(`✅ Created ${createdGroups.length} Chatter groups`);

  // Add members to groups
  const memberAssignments = [];
  for (const group of createdGroups) {
    // Add owner as admin
    memberAssignments.push({
      groupId: group.id,
      userId: group.ownerId,
      role: 'ADMIN',
    });

    // Add random members
    const memberCount = Math.floor(Math.random() * 5) + 3;
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(memberCount, shuffledUsers.length); i++) {
      const user = shuffledUsers[i];
      if (user.id !== group.ownerId) {
        memberAssignments.push({
          groupId: group.id,
          userId: user.id,
          role: 'MEMBER',
        });
      }
    }
  }

  // Remove duplicates
  const uniqueMembers = memberAssignments.filter(
    (member, index, self) =>
      index === self.findIndex((m) => m.groupId === member.groupId && m.userId === member.userId)
  );

  for (const member of uniqueMembers) {
    await prisma.groupMember.create({ data: member });
  }

  // Update member counts
  for (const group of createdGroups) {
    const count = await prisma.groupMember.count({ where: { groupId: group.id } });
    await prisma.chatterGroup.update({
      where: { id: group.id },
      data: { memberCount: count },
    });
  }
  console.log(`✅ Created ${uniqueMembers.length} group memberships`);

  // Create Feed Items
  const feedItemsData = [
    // General company posts
    {
      type: 'ANNOUNCEMENT' as const,
      body: '🎉 Exciting news! We just closed our biggest deal of the quarter - $2.5M with Acme Corporation! Huge congratulations to the entire sales team for their incredible work on this one. Special shoutout to the proposal team for the stunning pitch deck!',
      authorId: users[0].id,
      visibility: 'ALL_USERS',
    },
    {
      type: 'TEXT_POST' as const,
      body: 'Just finished onboarding our 100th customer this month! 🚀 The momentum is incredible. Thank you to everyone who made this possible.',
      authorId: users[1 % users.length].id,
      visibility: 'ALL_USERS',
    },
    {
      type: 'LINK_POST' as const,
      body: 'Check out our latest case study on how TechCorp increased their conversion rates by 45% using our platform. Great insights for anyone working with enterprise clients!',
      authorId: users[2 % users.length].id,
      linkUrl: 'https://example.com/case-studies/techcorp',
      linkTitle: 'TechCorp Success Story',
      visibility: 'ALL_USERS',
    },
    {
      type: 'TEXT_POST' as const,
      body: 'Pro tip for the sales team: I\'ve been using the new lead scoring feature extensively and it\'s been a game changer. Focus on leads with scores above 80 - they have a 3x higher conversion rate!',
      authorId: users[3 % users.length].id,
      visibility: 'ALL_USERS',
    },
    {
      type: 'STATUS_UPDATE' as const,
      body: 'Working from the Austin office this week! Would love to grab coffee with anyone in the area. 🤠☕',
      authorId: users[4 % users.length].id,
      visibility: 'ALL_USERS',
    },
    {
      type: 'TEXT_POST' as const,
      body: 'Just wrapped up a great discovery call with a Fortune 500 prospect. They\'re looking to consolidate their CRM and marketing tools - exactly our sweet spot! Demo scheduled for next week.',
      authorId: users[5 % users.length].id,
      visibility: 'ALL_USERS',
    },
    {
      type: 'ANNOUNCEMENT' as const,
      body: '📢 Reminder: Q4 planning kickoff is tomorrow at 2 PM. Please come prepared with your top 3 priorities and any resource needs. Meeting link in your calendar.',
      authorId: users[0].id,
      visibility: 'ALL_USERS',
    },
    {
      type: 'TEXT_POST' as const,
      body: 'Customer success win! 🏆 Just got off a call with DataFlow Inc - they\'ve renewed for 3 years and are expanding to 500 seats. Their NPS score is 78!',
      authorId: users[6 % users.length].id,
      visibility: 'ALL_USERS',
    },
    {
      type: 'LINK_POST' as const,
      body: 'Great article on modern sales techniques. The section on consultative selling really resonates with our approach.',
      authorId: users[7 % users.length].id,
      linkUrl: 'https://example.com/sales-best-practices-2024',
      linkTitle: 'Modern Sales Techniques for 2024',
      visibility: 'ALL_USERS',
    },
    {
      type: 'TEXT_POST' as const,
      body: 'Quick question for the team: What\'s your best strategy for re-engaging cold leads? I have a list of 50 that went dark 3 months ago.',
      authorId: users[8 % users.length].id,
      visibility: 'ALL_USERS',
    },
    // Group-specific posts
    {
      type: 'TEXT_POST' as const,
      body: 'New competitive intel: Our main competitor just raised their prices by 15%. This is a great opportunity for deals where we\'re competing head-to-head!',
      authorId: users[0].id,
      parentId: createdGroups[0].id,
      parentType: 'Group',
      visibility: 'ALL_USERS',
    },
    {
      type: 'TEXT_POST' as const,
      body: '🎨 The new brand guidelines are live! Please make sure to use the updated templates for all external communications. Link to assets in the comments.',
      authorId: users[1 % users.length].id,
      parentId: createdGroups[1].id,
      parentType: 'Group',
      visibility: 'ALL_USERS',
    },
    {
      type: 'TEXT_POST' as const,
      body: 'Heads up team: We\'re seeing an increase in tickets about the new dashboard. I\'ve created a quick FAQ doc to help with the common questions.',
      authorId: users[2 % users.length].id,
      parentId: createdGroups[2].id,
      parentType: 'Group',
      visibility: 'ALL_USERS',
    },
    {
      type: 'ANNOUNCEMENT' as const,
      body: '🚀 Version 4.2 is now live! Key features include: AI-powered lead recommendations, improved reporting dashboard, and bulk email enhancements.',
      authorId: users[0].id,
      parentId: createdGroups[3].id,
      parentType: 'Group',
      visibility: 'ALL_USERS',
    },
    {
      type: 'TEXT_POST' as const,
      body: 'Friday fun: What\'s everyone\'s favorite productivity hack? I\'ll start - I use the Pomodoro technique and it\'s doubled my focused work time! 🍅',
      authorId: users[3 % users.length].id,
      parentId: createdGroups[5].id,
      parentType: 'Group',
      visibility: 'ALL_USERS',
    },
  ];

  const createdFeedItems = [];
  const now = new Date();

  for (let i = 0; i < feedItemsData.length; i++) {
    const item = feedItemsData[i];
    // Create items with staggered timestamps (most recent first in array)
    const createdAt = new Date(now.getTime() - i * 3600000 * 4); // 4 hours apart

    const created = await prisma.feedItem.create({
      data: {
        type: item.type,
        body: item.body,
        authorId: item.authorId,
        parentId: item.parentId || null,
        parentType: item.parentType || null,
        linkUrl: item.linkUrl || null,
        linkTitle: item.linkTitle || null,
        visibility: item.visibility,
        likeCount: 0,
        commentCount: 0,
        createdAt,
        updatedAt: createdAt,
      },
    });
    createdFeedItems.push(created);
  }
  console.log(`✅ Created ${createdFeedItems.length} feed items`);

  // Create Comments on feed items
  const commentsData = [
    { feedItemIndex: 0, body: 'This is amazing! Great job everyone! 👏', authorId: users[1 % users.length].id },
    { feedItemIndex: 0, body: 'The persistence on this deal was incredible. Congrats!', authorId: users[2 % users.length].id },
    { feedItemIndex: 0, body: 'What was the key factor in closing this deal?', authorId: users[3 % users.length].id },
    { feedItemIndex: 1, body: '100 is just the beginning! 🚀', authorId: users[4 % users.length].id },
    { feedItemIndex: 2, body: 'Really great case study. Sharing with my prospects!', authorId: users[5 % users.length].id },
    { feedItemIndex: 3, body: 'Totally agree! The scoring algorithm is spot on.', authorId: users[6 % users.length].id },
    { feedItemIndex: 3, body: 'What threshold do you use for prioritization?', authorId: users[7 % users.length].id },
    { feedItemIndex: 4, body: 'Let\'s do lunch! I\'m at the downtown office.', authorId: users[8 % users.length].id },
    { feedItemIndex: 5, body: 'Need any support on the demo? Happy to join!', authorId: users[0].id },
    { feedItemIndex: 7, body: 'This is what customer success looks like! 🎯', authorId: users[1 % users.length].id },
    { feedItemIndex: 9, body: 'Try personalized video messages - worked great for me!', authorId: users[2 % users.length].id },
    { feedItemIndex: 9, body: 'LinkedIn engagement works well for B2B leads.', authorId: users[3 % users.length].id },
    { feedItemIndex: 10, body: 'Great intel! I\'ll update my battlecards.', authorId: users[4 % users.length].id },
    { feedItemIndex: 11, body: 'Love the new brand! Very modern.', authorId: users[5 % users.length].id },
    { feedItemIndex: 13, body: 'The AI recommendations are game changing!', authorId: users[6 % users.length].id },
    { feedItemIndex: 14, body: 'Time blocking has been huge for me!', authorId: users[7 % users.length].id },
  ];

  const createdComments = [];
  for (let i = 0; i < commentsData.length; i++) {
    const comment = commentsData[i];
    const feedItem = createdFeedItems[comment.feedItemIndex];
    if (!feedItem) continue;

    const createdAt = new Date(feedItem.createdAt.getTime() + (i + 1) * 1800000); // 30 min after post

    const created = await prisma.feedComment.create({
      data: {
        feedItemId: feedItem.id,
        body: comment.body,
        authorId: comment.authorId,
        likeCount: 0,
        createdAt,
        updatedAt: createdAt,
      },
    });
    createdComments.push(created);
  }

  // Update comment counts on feed items
  for (const feedItem of createdFeedItems) {
    const count = await prisma.feedComment.count({ where: { feedItemId: feedItem.id } });
    await prisma.feedItem.update({
      where: { id: feedItem.id },
      data: { commentCount: count },
    });
  }
  console.log(`✅ Created ${createdComments.length} comments`);

  // Create Likes on feed items and comments
  const likes = [];

  // Like feed items
  for (let i = 0; i < createdFeedItems.length; i++) {
    const feedItem = createdFeedItems[i];
    const likeCount = Math.floor(Math.random() * 8) + 2; // 2-9 likes per post
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5);

    for (let j = 0; j < Math.min(likeCount, shuffledUsers.length); j++) {
      const user = shuffledUsers[j];
      if (user.id !== feedItem.authorId) {
        likes.push({
          userId: user.id,
          feedItemId: feedItem.id,
          commentId: null,
        });
      }
    }
  }

  // Like some comments
  for (let i = 0; i < createdComments.length; i++) {
    const comment = createdComments[i];
    if (Math.random() > 0.5) { // 50% chance to have likes
      const likeCount = Math.floor(Math.random() * 3) + 1; // 1-3 likes
      const shuffledUsers = [...users].sort(() => Math.random() - 0.5);

      for (let j = 0; j < Math.min(likeCount, shuffledUsers.length); j++) {
        const user = shuffledUsers[j];
        if (user.id !== comment.authorId) {
          likes.push({
            userId: user.id,
            feedItemId: null,
            commentId: comment.id,
          });
        }
      }
    }
  }

  // Remove duplicate likes
  const uniqueLikes = likes.filter(
    (like, index, self) =>
      index === self.findIndex(
        (l) => l.userId === like.userId &&
               l.feedItemId === like.feedItemId &&
               l.commentId === like.commentId
      )
  );

  for (const like of uniqueLikes) {
    await prisma.feedLike.create({ data: like });
  }

  // Update like counts
  for (const feedItem of createdFeedItems) {
    const count = await prisma.feedLike.count({ where: { feedItemId: feedItem.id } });
    await prisma.feedItem.update({
      where: { id: feedItem.id },
      data: { likeCount: count },
    });
  }

  for (const comment of createdComments) {
    const count = await prisma.feedLike.count({ where: { commentId: comment.id } });
    await prisma.feedComment.update({
      where: { id: comment.id },
      data: { likeCount: count },
    });
  }
  console.log(`✅ Created ${uniqueLikes.length} likes`);

  // Show summary
  console.log('\n📊 Summary:');
  console.log(`   Chatter Groups: ${createdGroups.length}`);
  console.log(`   Group Members: ${uniqueMembers.length}`);
  console.log(`   Feed Items: ${createdFeedItems.length}`);
  console.log(`   Comments: ${createdComments.length}`);
  console.log(`   Likes: ${uniqueLikes.length}`);

  console.log('\n✅ Chatter seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding chatter data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
