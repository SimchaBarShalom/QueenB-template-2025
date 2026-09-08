const prisma = require("../lib/prisma");
const { CAPACITY_MEETING_STATUSES } = require("../lib/capacity");
const { currentMonthRange } = require("../lib/dates");
const { normalizePagination, paginationMeta } = require("../lib/pagination");

async function getAllMentors(query = {}) {
  const pagination = normalizePagination(query, 12);
  const supportsCount = typeof prisma.user.count === "function";
  const where = {
      mentorProfile: {
        is: {
          isActive: true,
        },
      },
      ...(query.jobTitle ? { jobTitle: query.jobTitle } : {}),
      ...(query.workplace ? { workplace: query.workplace } : {}),
      ...(query.topic ? { mentorProfile: { is: { isActive: true, mentoringTopics: { some: { name: query.topic } } } } } : {}),
  };
  const [total, mentors] = await Promise.all([
    supportsCount ? prisma.user.count({ where }) : Promise.resolve(null),
    prisma.user.findMany({
    where,

    include: {
      technologies: true,

      mentorProfile: {
        include: {
          mentoringTopics: true,
        },
      },
    },

    orderBy: {
      fullName: "asc",
    },
    ...(supportsCount ? { skip: pagination.skip, take: pagination.pageSize } : {}),
  })]);

  const { start, end } = currentMonthRange();

  const meetingsThisMonth = prisma.meeting?.findMany ? await prisma.meeting.findMany({
    where: {
      status: { in: CAPACITY_MEETING_STATUSES },
      scheduledStart: { gte: start, lt: end },
    },
    select: {
      request: { select: { mentorProfileId: true } },
    },
  }) : [];

  const usedCapacityByMentorProfileId = new Map();

  meetingsThisMonth.forEach((meeting) => {
    const { mentorProfileId } = meeting.request;

    usedCapacityByMentorProfileId.set(
      mentorProfileId,
      (usedCapacityByMentorProfileId.get(mentorProfileId) || 0) + 1
    );
  });

  const data = mentors.map((user) => {
    const meetingCapacity = user.mentorProfile.meetingCapacity;
    const usedCapacity =
      usedCapacityByMentorProfileId.get(user.mentorProfile.id) || 0;

    return {
      id: user.id,
      fullName: user.fullName,
      jobTitle: user.jobTitle,
      workplace: user.workplace,
      yearsOfExperience: user.yearsOfExperience,
      githubUrl: user.githubUrl,
      linkedinUrl: user.linkedinUrl,

      technologies: user.technologies.map(
        (technology) => technology.name
      ),

      mentorProfileId: user.mentorProfile.id,
      background: user.background || user.mentorProfile.background,
      meetingCapacity,
      meetingDurationMinutes:
        user.mentorProfile.meetingDurationMinutes,

      usedCapacity,
      remainingCapacity: Math.max(meetingCapacity - usedCapacity, 0),
      isFull: usedCapacity >= meetingCapacity,

      mentoringTopics:
        user.mentorProfile.mentoringTopics.map(
          (topic) => topic.name
        ),
    };
  });
  return supportsCount ? { data, pagination: paginationMeta({ ...pagination, total }) } : data;
}

module.exports = {
  getAllMentors,
};
