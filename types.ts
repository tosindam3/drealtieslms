
export type ContentBlockType = 'video' | 'text' | 'image' | 'file' | 'embed';

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  title: string;
  content?: string | null;
  completionValue?: number;
}

export type LessonBlockType = 'video' | 'text' | 'quiz' | 'assignment' | 'live';
export type TopicBlockType = 'video' | 'text' | 'photo';

export interface LessonBlock {
  id: string;
  type: LessonBlockType;
  title: string;
  payload: any;
  completionRule?: {
    type: string;
    value: any;
  };
  coinReward?: number;
  required?: boolean;
  isCompleted?: boolean;
}

export interface TopicBlock {
  id: string;
  type: TopicBlockType;
  payload: any;
}

export interface Topic {
  id: string;
  title: string;
  description?: string; // New: Added topic description for learning objectives
  thumbnailUrl: string;
  order: number;
  blocks: TopicBlock[];
  progressPercent?: number;
  isLocked?: boolean;
  isCompleted?: boolean;
}

export interface Lesson {
  id: string;
  number: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  estimatedDuration?: string;
  minTopicsCompletedPercent?: number;
  order: number;
  topics: Topic[];
  lessonBlocks: LessonBlock[];
  blocks?: ContentBlock[];
  type?: 'Video Lesson' | 'Text Lesson' | 'Video + Text Lesson' | 'Image Lesson' | 'Mixed Lesson' | 'Resource Only';
  status: 'draft' | 'published' | 'locked';
  isLocked?: boolean;
  isFree?: boolean; // New: Supports free preview logic
}

export interface LockPolicy {
  lockedByDefault: boolean;
  minCompletionPercent: number;
  minCoinsToUnlockNextWeek: number;
  deadlineAt?: string;
}

export interface Module {
  id: string;
  weekId: string;
  title: string;
  description?: string;
  order: number;
  position: number;
  thumbnailUrl?: string;
  lessons: Lesson[];
}

export interface Week {
  id: string;
  cohortId: string;
  number: number;
  title: string;
  thumbnailUrl?: string;
  lockPolicy: LockPolicy;
  modules: Module[];
  lessons: Lesson[];
  isFree?: boolean; // New: Supports Week 0 / Free foundation logic
}

export interface ProgramStructure {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'active' | 'completed' | 'archived';
  thumbnailUrl: string;
  weeks: Week[];
}

export interface Cohort {
  id: string;
  name: string;
  studentCount: number;
  maxStudents: number;
  startDate?: string;
  endDate?: string;
  // API response properties (snake_case)
  start_date?: string;
  end_date?: string;
  enrolled_count?: number;
  capacity?: number;
  status?: string;
}

export interface LearningOutcome {
  id: string;
  text: string;
}

export interface Prerequisite {
  id: string;
  text: string;
}

export interface CourseData {
  id: string;
  title: string;
  program: string;
  shortDescription: string;
  outcomes: LearningOutcome[];
  prerequisites: Prerequisite[];
  category: string;
  skillLevel: string;
  duration: string;
  visibility: 'Draft' | 'Published' | 'Private';
  coinBalance?: number;
  resumeTopic?: {
    topicId: string;
    lessonId: string;
    moduleId: string;
    title: string;
  } | null;
  upcomingTasks?: {
    id: string;
    title: string;
    course: string;
    due: string;
    type: 'Quiz' | 'Assignment';
  }[];
  upcomingClasses?: {
    id: string;
    title: string;
    time: string;
    instructor: string;
  }[];
  activityFeed?: {
    type: string;
    title: string;
    timestamp: string;
  }[];
  linkedCohorts: Cohort[];
  weeks: Week[];
}
