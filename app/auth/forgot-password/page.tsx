'use client';

import ForgotPasswordForm from '../../../components/auth/ForgotPasswordForm';
import AuthLayout from '../../../components/auth/AuthLayout';

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="Reset your password">
      <ForgotPasswordForm />
    </AuthLayout>
  );
}