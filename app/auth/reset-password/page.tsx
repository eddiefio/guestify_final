'use client';

import ResetPasswordForm from '../../../components/auth/ResetPasswordForm';
import AuthLayout from '../../../components/auth/AuthLayout';

export default function ResetPasswordPage() {
  return (
    <AuthLayout title="Reset your password">
      <ResetPasswordForm />
    </AuthLayout>
  );
}