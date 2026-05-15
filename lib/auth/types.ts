export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
};

export type MfaVerifyPayload = {
  code: string;
  mfaToken: string;
};

export type LoginResponse =
  | { status: 'MFA_REQUIRED'; mfaToken: string }
  | { status: 'MFA_SETUP_REQUIRED'; mfaSetupToken: string }
  | { accessToken: string };

export type RegisterResponse = {
  userId: string;
  email: string;
};
