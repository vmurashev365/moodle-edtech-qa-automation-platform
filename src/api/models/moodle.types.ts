export interface MoodleUser {
  id: number;
  username: string;
  fullname?: string;
}

export interface MoodleCourse {
  id: number;
  fullname: string;
  shortname?: string;
}

export interface MoodleAssignment {
  id: number;
  courseId: number;
  name: string;
}

export interface MoodleGrade {
  userId: number;
  assignmentId: number;
  grade: number;
}

export interface MoodleWebServiceRequest {
  functionName: string;
  params?: Record<string, string | number | boolean | undefined>;
}

export interface MoodleWebServiceException {
  exception: string;
  errorcode: string;
  message?: string;
  debuginfo?: string;
}

export interface MoodleWebServiceResponse<T> {
  status: number;
  data: T;
}
