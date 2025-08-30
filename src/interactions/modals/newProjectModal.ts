import { ModalSubmitInteraction, EmbedBuilder } from 'discord.js';
import { ProjectStatus } from '../../types/project.js';
import type { ProjectFormData } from '../../types/project.js';
import { CUSTOM_IDS, PROJECT_COLORS, PROJECT_EMOJIS } from '../../constants/project.js';
import { validateProjectData, sanitizeInput, extractClientIdFromCustomId, generateProjectId } from '../../utils/projectUtils.js';

export const customId = CUSTOM_IDS.NEW_PROJECT_MODAL;

export async function execute(interaction: ModalSubmitInteraction): Promise<void> {
    try {
        // Extract client ID from the modal's custom ID
        const clientId = extractClientIdFromCustomId(interaction.customId, CUSTOM_IDS.NEW_PROJECT_MODAL);
        
        if (!clientId) {
            await interaction.reply({
                content: `${PROJECT_EMOJIS.ERROR} Error: Could not identify the client. Please try running the command again.`,
                ephemeral: true
            });
            return;
        }

        // Extract and sanitize form data
        const clientNotesValue = interaction.fields.getTextInputValue(CUSTOM_IDS.PROJECT_CLIENT_NOTES_INPUT);
        const sanitizedClientNotes = sanitizeInput(clientNotesValue);
        
        const formData: ProjectFormData = {
            description: sanitizeInput(interaction.fields.getTextInputValue(CUSTOM_IDS.PROJECT_DESCRIPTION_INPUT)),
            payment: sanitizeInput(interaction.fields.getTextInputValue(CUSTOM_IDS.PROJECT_PAYMENT_INPUT)),
            paymentType: sanitizeInput(interaction.fields.getTextInputValue(CUSTOM_IDS.PROJECT_PAYMENT_TYPE_INPUT))
        };
        
        if (sanitizedClientNotes) {
            formData.clientNotes = sanitizedClientNotes;
        }

        // Validate the form data
        const validation = validateProjectData(formData);
        if (!validation.isValid) {
            const errorEmbed = new EmbedBuilder()
                .setTitle(`${PROJECT_EMOJIS.ERROR} Validation Error`)
                .setDescription('Please fix the following issues:')
                .addFields({
                    name: 'Errors',
                    value: validation.errors.map(error => `${PROJECT_EMOJIS.WARNING} ${error}`).join('\n')
                })
                .setColor(PROJECT_COLORS.ERROR)
                .setTimestamp();

            await interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true
            });
            return;
        }

        // Get the client user object
        const client = await interaction.client.users.fetch(clientId);
        
        // Generate project ID and create project data
        const projectId = generateProjectId();
        const projectData = {
            id: projectId,
            clientId,
            client,
            ...formData,
            status: ProjectStatus.PENDING,
            createdBy: interaction.user.id,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Create confirmation embed with all submitted information
        const confirmationEmbed = new EmbedBuilder()
            .setTitle(`${PROJECT_EMOJIS.SUCCESS} Project Created Successfully!`)
            .setDescription(`A new project has been created for ${client}.`)
            .addFields(
                { 
                    name: `${PROJECT_EMOJIS.CLIENT} Client`, 
                    value: `${client} (${client.tag})`, 
                    inline: true 
                },
                { 
                    name: `${PROJECT_EMOJIS.PAYMENT} Payment`, 
                    value: formData.payment, 
                    inline: true 
                },
                { 
                    name: `${PROJECT_EMOJIS.PAYMENT_TYPE} Payment Type`, 
                    value: formData.paymentType, 
                    inline: true 
                },
                { 
                    name: `${PROJECT_EMOJIS.DESCRIPTION} Description`, 
                    value: formData.description.length > 500 
                        ? `${formData.description.substring(0, 500)}...` 
                        : formData.description
                },
                { 
                    name: `${PROJECT_EMOJIS.NOTES} Additional Notes`, 
                    value: formData.clientNotes || 'None provided'
                },
                {
                    name: 'Project Details',
                    value: `**ID:** \`${projectId}\`\n**Status:** ${ProjectStatus.PENDING}`,
                    inline: false
                }
            )
            .setColor(PROJECT_COLORS.SUCCESS)
            .setTimestamp()
            .setFooter({ 
                text: `Project created by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setThumbnail(client.displayAvatarURL());

        // Reply with the confirmation embed (visible to everyone)
        await interaction.reply({
            embeds: [confirmationEmbed]
        });

        // Enhanced logging
        console.log(`${PROJECT_EMOJIS.SUCCESS} New project created:`);
        console.log(`  - Project ID: ${projectId}`);
        console.log(`  - Created by: ${interaction.user.tag} (${interaction.user.id})`);
        console.log(`  - Client: ${client.tag} (${client.id})`);
        console.log(`  - Description: ${formData.description}`);
        console.log(`  - Payment: ${formData.payment} (${formData.paymentType})`);
        console.log(`  - Notes: ${formData.clientNotes || 'None'}`);
        console.log(`  - Status: ${ProjectStatus.PENDING}`);

    } catch (error) {
        console.error('Error creating project:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle(`${PROJECT_EMOJIS.ERROR} Project Creation Failed`)
            .setDescription('An unexpected error occurred while creating the project.')
            .addFields({
                name: 'What to do next',
                value: '• Please try running the command again\n• If the problem persists, contact support'
            })
            .setColor(PROJECT_COLORS.ERROR)
            .setTimestamp();

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                embeds: [errorEmbed],
                ephemeral: true
            });
        } else {
            await interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true
            });
        }
    }
}