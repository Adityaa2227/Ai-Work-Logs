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

    useEffect(() => {
        if (companies && companies.length > 0) {
            const saved = localStorage.getItem('selectedCompany');
            const paypalCompany = companies.find(c => c.name.toLowerCase() === 'paypal');
            const found = paypalCompany || companies.find(c => c._id === saved);
            
            if (found) {
                setSelectedCompany(found);
                if (found._id !== saved) localStorage.setItem('selectedCompany', found._id);
            } else {
                setSelectedCompany(companies[0]);
            }
        } else if (companies && companies.length === 0) {
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

    const [isGlobalFormOpen, setIsGlobalFormOpen] = useState(false);
    const [globalFormPreset, setGlobalFormPreset] = useState(null); // { date: null, editingLog: null }

    const openGlobalForm = (preset = null) => {
        setGlobalFormPreset(preset);
        setIsGlobalFormOpen(true);
    };

    const closeGlobalForm = () => {
        setIsGlobalFormOpen(false);
        setGlobalFormPreset(null);
    };

    // Global Keydown for Ctrl+M
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
                e.preventDefault();
                openGlobalForm();
            }
            if (e.key === 'Escape' && isGlobalFormOpen) {
                closeGlobalForm();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isGlobalFormOpen]);

    const updateCompanyMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            const res = await api.put(`/companies/${id}`, data);
            return res.data;
        },
        onSuccess: (updatedData) => {
            queryClient.invalidateQueries(['companies']);
            setSelectedCompany(updatedData);
            toast.success('Template settings saved');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update settings');
        }
    });

    return (
        <CompanyContext.Provider value={{ 
            companies, 
            selectedCompany, 
            selectCompany, 
            createCompany: createMutation.mutate,
            updateCompany: updateCompanyMutation.mutate,
            isLoading,
            isGlobalFormOpen,
            globalFormPreset,
            openGlobalForm,
            closeGlobalForm
        }}>
            {children}
        </CompanyContext.Provider>
    );
};

export const useCompany = () => useContext(CompanyContext);
