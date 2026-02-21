# Requirements Document

## Introduction

DrealtiesFX Academy is a cohort-based, gamified Forex learning platform that provides structured 8-week educational programs. The system combines traditional e-learning with gamification elements through a "Dreal Coin" reward system and enforces sequential progression through weekly content gates. Students must complete required activities and earn sufficient coins to unlock subsequent weeks, ensuring engagement and mastery before advancement.

## Glossary

- **Academy**: The DrealtiesFX Academy learning platform system
- **Cohort**: An 8-week structured learning program with enrolled students
- **Week**: A time-bounded learning unit within a cohort containing lessons, quizzes, assignments, and live classes
- **Lesson**: A collection of related topics within a week
- **Topic**: Individual learning content units (videos, articles, etc.)
- **Dreal_Coin**: The gamification currency earned through platform activities
- **Completion_Rule**: Criteria that must be met to unlock the next week
- **Progress_Tracker**: System component that monitors and displays learning progress
- **Admin_Builder**: Administrative interface for creating and managing cohort content
- **Student**: A user enrolled in a cohort with learning access
- **Instructor**: A user with teaching responsibilities and content management access
- **Administrator**: A user with full system management capabilities

## Requirements

### Requirement 1: Cohort Enrollment and Management

**User Story:** As a student, I want to enroll in cohorts rather than individual courses, so that I can participate in structured, time-bound learning experiences with other students.

#### Acceptance Criteria

1. WHEN a student views available cohorts, THE Academy SHALL display cohorts with enrollment status, start dates, and capacity information
2. WHEN a student enrolls in a cohort, THE Academy SHALL add them to the cohort participant list and set their initial progress state
3. WHEN a cohort reaches capacity, THE Academy SHALL prevent additional enrollments and display "Full" status
4. WHEN a cohort start date arrives, THE Academy SHALL automatically unlock Week 1 content for all enrolled students
5. THE Academy SHALL enforce that students can only be enrolled in one active cohort at a time

### Requirement 2: Sequential Week Progression System

**User Story:** As a student, I want weeks to unlock sequentially based on my completion and coin earnings, so that I progress through content in the intended order and demonstrate mastery.

#### Acceptance Criteria

1. WHEN a student enrolls in a cohort, THE Academy SHALL unlock only Week 1 content
2. WHEN a student attempts to access a locked week, THE Academy SHALL display completion requirements and current progress
3. WHEN a student meets all completion rules for a week, THE Academy SHALL unlock the next week's content
4. WHEN a student completes Week 8, THE Academy SHALL mark the cohort as completed for that student
5. THE Academy SHALL prevent access to week content if prerequisite weeks are not completed

### Requirement 3: Structured Weekly Content Organization

**User Story:** As an instructor, I want to organize content into weeks containing lessons, topics, quizzes, assignments, and live classes, so that students have a clear learning structure.

#### Acceptance Criteria

1. WHEN creating week content, THE Admin_Builder SHALL allow instructors to add lessons, quizzes, assignments, and live classes
2. WHEN a lesson is created, THE Admin_Builder SHALL allow instructors to add multiple topics to that lesson
3. WHEN students access a week, THE Academy SHALL display all content types in a structured format
4. WHEN content is published, THE Academy SHALL validate that all required components are present
5. THE Academy SHALL maintain the hierarchical relationship between weeks, lessons, and topics

### Requirement 4: Dreal Coin Gamification System

**User Story:** As a student, I want to earn Dreal Coins for completing activities, so that I feel motivated and can track my engagement with the platform.

#### Acceptance Criteria

1. WHEN a student completes a topic, THE Academy SHALL award the configured Dreal_Coin amount
2. WHEN a student passes a quiz, THE Academy SHALL award Dreal_Coins based on the score achieved
3. WHEN a student's assignment is approved, THE Academy SHALL award the configured Dreal_Coin amount
4. WHEN a student completes all requirements for a week, THE Academy SHALL award bonus Dreal_Coins
5. WHEN Dreal_Coins are awarded, THE Academy SHALL display reward animations and update the student's total balance

### Requirement 5: Progress Tracking and Visualization

**User Story:** As a student, I want to see my progress through cohorts and weeks with visual indicators, so that I understand my current status and what needs to be completed.

#### Acceptance Criteria

1. WHEN a student views their dashboard, THE Progress_Tracker SHALL display cohort-level progress as a percentage
2. WHEN a student views a week, THE Progress_Tracker SHALL display week-level progress for all content types
3. WHEN progress changes, THE Progress_Tracker SHALL update progress bars in real-time
4. WHEN a student completes an item, THE Progress_Tracker SHALL show completion animations
5. THE Progress_Tracker SHALL display both completion status and Dreal_Coin earnings for each activity

### Requirement 6: Quiz System with Attempts and Grading

**User Story:** As a student, I want to take quizzes with multiple attempts and receive immediate feedback, so that I can assess my understanding and improve my knowledge.

#### Acceptance Criteria

1. WHEN a student starts a quiz, THE Academy SHALL record the attempt and timestamp
2. WHEN a student submits quiz answers, THE Academy SHALL calculate and display the score immediately
3. WHEN a quiz allows multiple attempts, THE Academy SHALL track all attempts and use the highest score
4. WHEN a student achieves the passing score, THE Academy SHALL mark the quiz as completed and award Dreal_Coins
5. THE Academy SHALL prevent quiz access if maximum attempts are exceeded

### Requirement 7: Assignment Submission and Approval Workflow

**User Story:** As a student, I want to submit assignments for instructor review, so that I can receive feedback and earn completion credit.

#### Acceptance Criteria

1. WHEN a student submits an assignment, THE Academy SHALL store the submission with timestamp and student information
2. WHEN an instructor reviews a submission, THE Academy SHALL allow approval, rejection, or request for revision
3. WHEN an assignment is approved, THE Academy SHALL mark it as completed and award Dreal_Coins to the student
4. WHEN an assignment is rejected, THE Academy SHALL allow the student to resubmit with instructor feedback
5. THE Academy SHALL notify students of assignment status changes via the platform

### Requirement 8: Live Class Scheduling and Attendance

**User Story:** As an instructor, I want to schedule live classes and track attendance, so that I can provide real-time instruction and monitor student participation.

#### Acceptance Criteria

1. WHEN an instructor schedules a live class, THE Academy SHALL store the date, time, and meeting details
2. WHEN a live class is scheduled, THE Academy SHALL notify all cohort students of the upcoming session
3. WHEN a student joins a live class, THE Academy SHALL record their attendance
4. WHEN a live class ends, THE Academy SHALL award Dreal_Coins to students who attended
5. THE Academy SHALL display live class schedules in student and instructor dashboards

### Requirement 9: Role-Based Access Control

**User Story:** As a system administrator, I want to control access based on user roles, so that users can only perform actions appropriate to their responsibilities.

#### Acceptance Criteria

1. WHEN a user logs in, THE Academy SHALL determine their role and grant appropriate permissions
2. WHEN an Administrator accesses the system, THE Academy SHALL provide full management capabilities
3. WHEN an Instructor accesses the system, THE Academy SHALL provide content creation and student management capabilities
4. WHEN a Student accesses the system, THE Academy SHALL provide learning content and progress tracking capabilities
5. THE Academy SHALL prevent users from accessing features outside their role permissions

### Requirement 10: Admin Builder with Content Management

**User Story:** As an administrator, I want to create and manage cohort content through a builder interface, so that I can efficiently set up learning programs.

#### Acceptance Criteria

1. WHEN creating a cohort, THE Admin_Builder SHALL allow configuration of duration, capacity, and start date
2. WHEN building week content, THE Admin_Builder SHALL provide interfaces for adding lessons, topics, quizzes, and assignments
3. WHEN configuring completion rules, THE Admin_Builder SHALL allow setting required activities and Dreal_Coin thresholds
4. WHEN publishing content, THE Admin_Builder SHALL validate that all required components are configured
5. THE Admin_Builder SHALL allow preview of student experience before publishing

### Requirement 11: API Integration and State Management

**User Story:** As a developer, I want a comprehensive REST API with proper state management, so that the frontend can efficiently interact with the backend system.

#### Acceptance Criteria

1. WHEN the frontend requests data, THE Academy SHALL provide RESTful API endpoints with consistent response formats
2. WHEN data changes occur, THE Academy SHALL invalidate relevant caches and notify connected clients
3. WHEN authentication is required, THE Academy SHALL use Laravel Sanctum for secure token-based authentication
4. WHEN API errors occur, THE Academy SHALL return appropriate HTTP status codes and error messages
5. THE Academy SHALL implement proper caching strategies to optimize performance

### Requirement 12: Data Persistence and Integrity

**User Story:** As a system administrator, I want reliable data storage with referential integrity, so that the platform maintains consistent and accurate information.

#### Acceptance Criteria

1. WHEN data is stored, THE Academy SHALL use MySQL database with proper foreign key constraints
2. WHEN related records are deleted, THE Academy SHALL handle cascading operations appropriately
3. WHEN concurrent operations occur, THE Academy SHALL prevent data corruption through proper locking mechanisms
4. WHEN system backups are needed, THE Academy SHALL support database export and import operations
5. THE Academy SHALL maintain audit trails for critical data changes

### Requirement 13: Frontend Integration and Enhancement

**User Story:** As a developer, I want to audit and enhance the existing React frontend, so that it integrates seamlessly with the new backend system.

#### Acceptance Criteria

1. WHEN auditing the existing frontend, THE Academy SHALL identify components that need modification or replacement
2. WHEN integrating with the API, THE Academy SHALL implement proper error handling and loading states
3. WHEN displaying gamification elements, THE Academy SHALL show reward animations and progress indicators
4. WHEN users interact with the interface, THE Academy SHALL provide responsive and intuitive user experience
5. THE Academy SHALL maintain consistent design patterns throughout the application

### Requirement 14: Testing and Verification Infrastructure

**User Story:** As a developer, I want comprehensive testing tools and verification processes, so that the system reliability can be validated before deployment.

#### Acceptance Criteria

1. WHEN developing features, THE Academy SHALL include automated tests for critical user flows
2. WHEN API endpoints are created, THE Academy SHALL provide Postman collections for testing
3. WHEN system integration is complete, THE Academy SHALL support end-to-end verification scenarios
4. WHEN bugs are discovered, THE Academy SHALL include regression tests to prevent reoccurrence
5. THE Academy SHALL provide seed data and test fixtures for development and testing environments