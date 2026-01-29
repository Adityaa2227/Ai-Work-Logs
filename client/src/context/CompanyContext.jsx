import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from 'sonner';

const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
    const [selectedCompany, setSelectedCompany] = useState(null);
    const queryClient = useQueryClient();

    const { data: companies, isLoading } = useQuery({
        queryKey: ['companies'],
        queryFn: async () => {
            const res = await api.get('/companies');
            return res.data;
        }
    });

    // Load initial company from local storage or default to first
    useEffect(() => {
        if (companies && companies.length > 0) {
            const saved = localStorage.getItem('selectedCompany');
            const found = companies.find(c => c._id === saved);
            if (found) {
                setSelectedCompany(found);
            } else {
                setSelectedCompany(companies[0]);
            }
        } else if (companies && companies.length === 0) {
            // No companies? user needs to create one.
            setSelectedCompany(null);
        }
    }, [companies]);

    const selectCompany = (company) => {
        setSelectedCompany(company);
        localStorage.setItem('selectedCompany', company._id);
        // Invalidate all data when switching
        queryClient.invalidateQueries(); 
    };

    const createMutation = useMutation({
        mutationFn: async (name) => {
            const res = await api.post('/companies', { name });
            return res.data;
        },
        onSuccess: (newCompany) => {
            queryClient.invalidateQueries(['companies']);
            selectCompany(newCompany);
            toast.success(`Switched to ${newCompany.name}`);
        },
        onError: (error) => {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to create company');
        }
    });

    return (
        <CompanyContext.Provider value={{ 
            companies, 
            selectedCompany, 
            selectCompany, 
            createCompany: createMutation.mutate,
            isLoading 
        }}>
            {children}
        </CompanyContext.Provider>
    );
};

export const useCompany = () => useContext(CompanyContext);
