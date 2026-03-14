import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { Subscription, Plan } from '../types';

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const data = await apiFetch('/subscription');
        setSubscription(data.subscription);
        setPlan(data.plan);
      } catch (err) {
        console.error('Error fetching subscription:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  return { subscription, plan, loading };
}
