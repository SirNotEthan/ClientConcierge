import { PaymentType } from '../types/project.js';
import type { ProjectConfig } from '../types/project.js';

export const PROJECT_CONFIG: ProjectConfig = {
    maxDescriptionLength: 2000,
    maxPaymentLength: 100,
    maxPaymentTypeLength: 50,
    maxClientNotesLength: 1000,
    allowedPaymentTypes: Object.values(PaymentType)
};

export const PROJECT_COLORS = {
    SUCCESS: '#00FF00',
    ERROR: '#FF0000',
    WARNING: '#FFA500',
    INFO: '#0099FF',
    PENDING: '#FFFF00'
} as const;

export const PROJECT_EMOJIS = {
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
    INFO: 'ℹ️',
    CLIENT: '👤',
    PAYMENT: '💰',
    PAYMENT_TYPE: '💳',
    DESCRIPTION: '📝',
    NOTES: '📋',
    FORM: '📄',
    CREATE: '➕'
} as const;

export const CUSTOM_IDS = {
    NEW_PROJECT_BUTTON: 'newproject_button',
    NEW_PROJECT_MODAL: 'newproject_modal',
    PROJECT_DESCRIPTION_INPUT: 'project_description',
    PROJECT_PAYMENT_INPUT: 'project_payment',
    PROJECT_PAYMENT_TYPE_INPUT: 'project_payment_type',
    PROJECT_CLIENT_NOTES_INPUT: 'project_client_notes'
} as const;