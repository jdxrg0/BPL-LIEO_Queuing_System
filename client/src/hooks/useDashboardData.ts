import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api, socket } from '../api';
import { Service, Ticket, PriorityGroup } from '../types';

export function useDashboardData(userId?: number) {
  const queryClient = useQueryClient();

  const services = useQuery<Service[]>({ queryKey: ['services'], queryFn: api.getServices, initialData: [] });
  const queue = useQuery<Ticket[]>({ queryKey: ['queue'], queryFn: api.getWaitingQueue, initialData: [] });
  const serving = useQuery<Ticket[]>({ queryKey: ['serving', userId], queryFn: () => api.getMyServing(userId!), enabled: !!userId, initialData: [] });
  const postponed = useQuery<Ticket[]>({ queryKey: ['postponed'], queryFn: api.getPostponedTickets, initialData: [] });
  const priorityGroups = useQuery<PriorityGroup[]>({ queryKey: ['priorityGroups'], queryFn: api.getPriorityGroups, initialData: [] });

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;
    const handleUpdate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['queue'] });
        queryClient.invalidateQueries({ queryKey: ['serving'] });
        queryClient.invalidateQueries({ queryKey: ['postponed'] });
        queryClient.invalidateQueries({ queryKey: ['services'] });
        queryClient.invalidateQueries({ queryKey: ['priorityGroups'] });
      }, 500);
    };

    socket.on('queueUpdated', handleUpdate);
    socket.on('ticketCreated', handleUpdate);
    socket.on('ticketDeleted', handleUpdate);
    socket.on('priorityGroupsUpdated', handleUpdate);

    return () => {
      clearTimeout(debounceTimer);
      socket.off('queueUpdated', handleUpdate);
      socket.off('ticketCreated', handleUpdate);
      socket.off('ticketDeleted', handleUpdate);
      socket.off('priorityGroupsUpdated', handleUpdate);
    };
  }, [queryClient]);

  return {
    services: services.data,
    queue: queue.data,
    currentServingList: serving.data,
    postponedTickets: postponed.data,
    priorityGroups: priorityGroups.data,
    isLoading: services.isLoading || queue.isLoading || serving.isLoading
  };
}
