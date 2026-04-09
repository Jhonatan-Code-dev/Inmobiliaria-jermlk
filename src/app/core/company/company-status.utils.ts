import { Empresa } from '../auth/auth.models';

export type CompanyStatusTone = 'success' | 'warning' | 'danger';

const isValidDate = (value: Date): boolean => !Number.isNaN(value.getTime());

export const getCompanyStatusLabel = (company: Empresa | null | undefined): string => {
  if (!company) {
    return 'Sin empresa';
  }

  return company.estado ? 'Activa' : 'Inactiva';
};

export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return 'Sin fecha';
  }

  const date = new Date(value);

  if (!isValidDate(date)) {
    return value;
  }

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'long',
    timeStyle: 'short'
  }).format(date);
};

export const getDaysRemainingLabel = (company: Empresa | null | undefined): string => {
  const expirationValue = company?.vencimiento;

  if (!expirationValue) {
    return 'Sin vencimiento';
  }

  const expirationDate = new Date(expirationValue);

  if (!isValidDate(expirationDate)) {
    return 'Fecha invalida';
  }

  const now = new Date();
  const diffInDays = Math.ceil((expirationDate.getTime() - now.getTime()) / 86_400_000);

  if (diffInDays < 0) {
    return 'Vencida';
  }

  if (diffInDays === 0) {
    return 'Vence hoy';
  }

  if (diffInDays === 1) {
    return '1 dia restante';
  }

  return `${diffInDays} dias restantes`;
};

export const getCompanyStatusTone = (
  company: Empresa | null | undefined
): CompanyStatusTone => {
  if (!company?.estado) {
    return 'warning';
  }

  if (!company.vencimiento) {
    return 'danger';
  }

  const expirationDate = new Date(company.vencimiento);

  if (!isValidDate(expirationDate) || expirationDate.getTime() < Date.now()) {
    return 'danger';
  }

  return 'success';
};
