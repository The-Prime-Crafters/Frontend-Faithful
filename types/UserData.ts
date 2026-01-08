export interface UserData {
  name: string;
  email: string;
  picture?: string;
  userId: number;
  signUpDate?: string;
  signupMethod?: string;
  bibleVersion?: string;
  [key: string]: any;
}

export const defaultUserData: UserData = {
  name: '',
  email: '',
  picture: '',
  userId: 0,
  signUpDate: '',
  signupMethod: '',
  bibleVersion: '',
};
