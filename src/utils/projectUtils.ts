import { PaymentType } from '../types/project.js';
import type { ProjectFormData, ProjectValidationResult } from '../types/project.js';
import { PROJECT_CONFIG } from '../constants/project.js';

export function validateProjectData(formData: ProjectFormData): ProjectValidationResult {
    const errors: string[] = [];

    // Validate description
    if (!formData.description?.trim()) {
        errors.push('Project description is required.');
    } else if (formData.description.length > PROJECT_CONFIG.maxDescriptionLength) {
        errors.push(`Project description must be ${PROJECT_CONFIG.maxDescriptionLength} characters or less.`);
    }

    // Validate payment
    if (!formData.payment?.trim()) {
        errors.push('Payment amount is required.');
    } else if (formData.payment.length > PROJECT_CONFIG.maxPaymentLength) {
        errors.push(`Payment amount must be ${PROJECT_CONFIG.maxPaymentLength} characters or less.`);
    }

    // Validate payment type
    if (!formData.paymentType?.trim()) {
        errors.push('Payment type is required.');
    } else if (formData.paymentType.length > PROJECT_CONFIG.maxPaymentTypeLength) {
        errors.push(`Payment type must be ${PROJECT_CONFIG.maxPaymentTypeLength} characters or less.`);
    }

    // Validate client notes (optional)
    if (formData.clientNotes && formData.clientNotes.length > PROJECT_CONFIG.maxClientNotesLength) {
        errors.push(`Client notes must be ${PROJECT_CONFIG.maxClientNotesLength} characters or less.`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

export function sanitizeInput(input: string): string {
    return input.trim().replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove zero-width characters
}

export function formatPaymentType(paymentType: string): PaymentType {
    const upperType = paymentType.toUpperCase();
    
    // Try to match with known payment types
    for (const type of Object.values(PaymentType)) {
        if (type.toUpperCase() === upperType) {
            return type;
        }
    }
    
    return PaymentType.OTHER;
}

export function generateProjectId(): string {
    return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function isValidCustomId(customId: string, expectedPrefix: string): boolean {
    return customId.startsWith(`${expectedPrefix}_`);
}

export function extractClientIdFromCustomId(customId: string, expectedPrefix: string): string | null {
    if (!isValidCustomId(customId, expectedPrefix)) {
        return null;
    }
    
    const parts = customId.split('_');
    return parts.length >= 3 ? (parts[2] || null) : null;
}