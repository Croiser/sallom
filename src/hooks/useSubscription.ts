import { useState, useEffect } from 'react';
import { Subscription, Plan } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const plansData = await api.get('/plans');
      setPlans(plansData.sort((a: any, b: any) => a.priceMonthly - b.priceMonthly));

      if (user) {
        const subResponse = await api.get('/subscription');
        setSubscription(subResponse.subscription);
        setPlan(subResponse.plan);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  return { subscription, plan, plans, loading, refresh: fetchData };
}
