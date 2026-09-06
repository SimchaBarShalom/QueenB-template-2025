const prisma = require("../lib/prisma");

async function getAllMentors() {
  const mentors = await prisma.user.findMany({
    where: {
      mentorProfile: {
        isNot: null,
      },
    },

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
  });

  return mentors.map((user) => ({
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
    background: user.mentorProfile.background,
    meetingCapacity: user.mentorProfile.meetingCapacity,
    meetingDurationMinutes:
      user.mentorProfile.meetingDurationMinutes,

    mentoringTopics:
      user.mentorProfile.mentoringTopics.map(
        (topic) => topic.name
      ),
  }));
}

module.exports = {
  getAllMentors,
};