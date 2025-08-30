import { User } from 'discord.js';

export interface ProjectData {
    id: string;
    clientId: string;
    client?: User;
    description: string;
    payment: string;
    paymentType: PaymentType;
    clientNotes?: string;
    status: ProjectStatus;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProjectFormData {
    description: string;
    payment: string;
    paymentType: string;
    clientNotes?: string | undefined;
}

export enum PaymentType {
    USD = 'USD',
    EUR = 'EUR',
    BTC = 'BTC',
    ETH = 'ETH',
    HOURLY = 'Hourly',
    FIXED = 'Fixed',
    OTHER = 'Other'
}

export enum ProjectStatus {
    PENDING = 'Pending',
    IN_PROGRESS = 'In Progress',
    COMPLETED = 'Completed',
    CANCELLED = 'Cancelled',
    ON_HOLD = 'On Hold'
}

export interface ProjectValidationResult {
    isValid: boolean;
    errors: string[];
}

export interface ProjectConfig {
    maxDescriptionLength: number;
    maxPaymentLength: number;
    maxPaymentTypeLength: number;
    maxClientNotesLength: number;
    allowedPaymentTypes: PaymentType[];
}