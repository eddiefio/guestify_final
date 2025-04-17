'use client';

import SignUpForm from '../../../components/auth/SignUpForm';
import AuthLayout from '../../../components/auth/AuthLayout';

export default function SignUpPage() {
  return (
    <AuthLayout title="Create your account">
      <SignUpForm />
    </AuthLayout>
  );
}