import { ButtonInteraction } from 'discord.js';
import { createProjectModal } from '../../commands/management/newProject.js';
import { CUSTOM_IDS, PROJECT_COLORS, PROJECT_EMOJIS } from '../../constants/project.js';
import { extractClientIdFromCustomId } from '../../utils/projectUtils.js';

export const customId = CUSTOM_IDS.NEW_PROJECT_BUTTON;

export async function execute(interaction: ButtonInteraction): Promise<void> {
    try {
        const clientId = extractClientIdFromCustomId(interaction.customId, CUSTOM_IDS.NEW_PROJECT_BUTTON);
        
        if (!clientId) {
            await interaction.reply({
                content: `${PROJECT_EMOJIS.ERROR} Error: Could not identify the client. Please try running the command again.`,
                ephemeral: true
            });
            return;
        }

        const modal = createProjectModal(clientId);
        await interaction.showModal(modal);
    } catch (error) {
        console.error('Error in newProjectButton:', error);
        
        const errorMessage = `${PROJECT_EMOJIS.ERROR} An unexpected error occurred. Please try again.`;
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    }
}