# Bugfix Requirements Document

## Introduction

This document addresses a TypeError that occurs in ClassDetail.js when reloading the page and clicking the "Bài Tập" (Assignments) tab. The error "Cannot read properties of undefined (reading 'toString')" occurs at lines 879 and 891 because the code attempts to call `.toString()` on `assignmentId` or `studentId` properties that may be undefined during initial data loading.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the page is reloaded and the "Bài Tập" tab is clicked before submission data is fully loaded THEN the system crashes with TypeError: Cannot read properties of undefined (reading 'toString') at line 879

1.2 WHEN the page is reloaded and the "Bài Tập" tab is clicked before submission data is fully loaded THEN the system crashes with TypeError: Cannot read properties of undefined (reading 'toString') at line 891

1.3 WHEN submission data contains entries where `assignmentId` or `studentId` properties are undefined or null THEN the system attempts to call `.toString()` on undefined values causing a crash

### Expected Behavior (Correct)

2.1 WHEN the page is reloaded and the "Bài Tập" tab is clicked before submission data is fully loaded THEN the system SHALL handle undefined values gracefully without crashing and display appropriate loading or empty states

2.2 WHEN submission data contains entries where `assignmentId` or `studentId` properties are undefined or null THEN the system SHALL check for existence before calling `.toString()` and skip invalid entries

2.3 WHEN comparing submission IDs with assignment IDs THEN the system SHALL validate that both values exist before performing string conversion and comparison operations

### Unchanged Behavior (Regression Prevention)

3.1 WHEN submission data is fully loaded with valid `assignmentId` and `studentId` properties THEN the system SHALL CONTINUE TO correctly match submissions to assignments and display scores

3.2 WHEN a student has submitted an assignment with a valid score THEN the system SHALL CONTINUE TO display the score in the format "{score}/{maxScore}" with green color

3.3 WHEN a student has submitted an assignment without a score THEN the system SHALL CONTINUE TO display "Đã nộp (chưa chấm)" in gray color

3.4 WHEN a student has not submitted an assignment THEN the system SHALL CONTINUE TO display "-" in light gray color

3.5 WHEN the user is a teacher viewing the assignments tab THEN the system SHALL CONTINUE TO display the correct view without being affected by this fix
