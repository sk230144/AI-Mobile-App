export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  CallHistory: undefined;
  CallDetails: { callId: string };
};

export type Call = {
  id: string;
  user_id: string;
  caller_number: string;
  call_duration: number;
  call_status: string;
  recording_url?: string;
  transcript?: string;
  is_spam: boolean;
  created_at: string;
};

export type Violation = {
  id: string;
  call_id: string;
  violation_type: string;
  violation_description: string;
  timestamp_in_call: number;
  confidence_score: number;
};
