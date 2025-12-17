'use client';

import { useParams } from 'next/navigation';
import { redirect } from 'next/navigation';

export default function DatabasePage() {
  const params = useParams();
  const dbname = params?.dbname as string;

  // Redirect to tables tab by default
  redirect(`/home/${dbname}/tables`);
}
